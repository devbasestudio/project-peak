import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { appBaseUrl, ensureTelegramUserAccount, normalizeTelegramLoginId } from '@/lib/adminAuth';
import { notifyAdminsPayment } from '@/lib/telegram';

// Instantiate Supabase Admin Client using Service Role Key (with fallbacks to prevent build-time crashes)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
);

// ---- Helpers ----

/** Map the human-readable program title to the DB program_type key */
function getProgramType(programName: string): string {
  const lower = programName.toLowerCase();
  if (lower.includes('project') || lower.includes('20')) return 'project_20';
  if (lower.includes('mass')) return 'mass_method';
  return 'skinnyfat_recomp';
}

/** Default macros & calories per program type */
function getProgramDefaults(programType: string) {
  switch (programType) {
    case 'project_20':
      return { target_calories: 1500, macros_p: 140, macros_c: 120, macros_f: 45 };
    case 'mass_method':
      return { target_calories: 3000, macros_p: 180, macros_c: 350, macros_f: 80 };
    default: // skinnyfat_recomp
      return { target_calories: 1800, macros_p: 150, macros_c: 180, macros_f: 50 };
  }
}

/** Ensure the Supabase Storage bucket exists (idempotent) */
let bucketReady = false;
async function ensureBucket() {
  if (bucketReady) return;
  const { error } = await supabaseAdmin.storage.createBucket('registrations', {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10 MB
  });
  // 'already exists' is fine — any other error we just log
  if (error && !error.message?.includes('already exists')) {
    console.warn('Storage bucket creation note:', error.message);
  }
  bucketReady = true;
}

/** Upload a File to Supabase Storage and return its public URL */
async function uploadFile(file: File | null, prefix: string): Promise<string | null> {
  if (!file || file.size === 0) return null;

  await ensureBucket();

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from('registrations')
    .upload(filename, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });

  if (error) {
    console.error('Storage upload error:', error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from('registrations').getPublicUrl(filename);

  return publicUrl;
}

// ---- Route Handler ----

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // --- Extract form fields ---
    const name = (formData.get('username') as string) || '';
    const age = parseInt((formData.get('age') as string) || '0', 10);
    const height = (formData.get('height') as string) || '';
    const weight = parseFloat((formData.get('weight') as string) || '0');
    const email = (formData.get('email') as string) || '';
    const phone = (formData.get('phone') as string) || '';
    const split = (formData.get('workout_split') as string) || '';
    const notes = (formData.get('notes') as string) || '';
    const programName = (formData.get('program_name') as string) || '';
    const telegramId = normalizeTelegramLoginId((formData.get('telegram_id') as string) || '').replace(/^@/, '');
    const durationMonths = parseInt((formData.get('duration_months') as string) || '3', 10);
    const programPrice = parseInt((formData.get('program_price') as string) || '0', 10);
    const paymentMethod = (formData.get('payment_method') as string) || '';

    const photoFrontFile = formData.get('photo_front') as File | null;
    const photoBackFile = formData.get('photo_back') as File | null;
    const photoSideFile = formData.get('photo_side') as File | null;
    const paymentScreenshotFile = formData.get('payment_screenshot') as File | null;

    // --- Upload files to Supabase Storage (not local filesystem) ---
    const photo_front = await uploadFile(photoFrontFile, 'photo_front');
    const photo_back = await uploadFile(photoBackFile, 'photo_back');
    const photo_side = await uploadFile(photoSideFile, 'photo_side');
    const payment_screenshot = await uploadFile(paymentScreenshotFile, 'payment');

    // --- Determine correct program type & defaults ---
    const programType = getProgramType(programName);
    const programDefaults = getProgramDefaults(programType);

    let userId: string | null = null;

    if (telegramId) {
      const telegramAccount = await ensureTelegramUserAccount({
        telegramId,
        username: name,
        firstName: name,
        email,
      });
      userId = telegramAccount.userId;
    } else {
      // --- Check if email already exists in profiles ---
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      userId = existingProfile ? existingProfile.id : null;
    }

    if (!userId) {
      // Find the admin / head trainer to assign
      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      const trainerId = admins && admins.length > 0 ? admins[0].id : null;

      // Create new Supabase Auth user (password = phone number)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: phone, // phone is the default password
        email_confirm: true,
        user_metadata: {
          username: name,
          telegram_id: telegramId,
        },
      });

      if (createError) throw createError;
      userId = newUser.user.id;

      if (userId) {
        // Assign trainer
        if (trainerId) {
          const { error: updateProfileError } = await supabaseAdmin
            .from('profiles')
            .update({ trainer_id: trainerId })
            .eq('id', userId);

          if (updateProfileError) throw updateProfileError;
        }

        // Create program with the CORRECT program_type and matching macros/calories
        const today = new Date().toISOString().split('T')[0];
        const { error: programInsertError } = await supabaseAdmin
          .from('programs')
          .insert({
            user_id: userId,
            program_type: programType,
            duration_weeks: Math.max(4, durationMonths * 4),
            start_date: today,
            ...programDefaults,
          });

        if (programInsertError) throw programInsertError;

        // Add default motivational quote
        const { error: quoteInsertError } = await supabaseAdmin
          .from('motivational_quotes')
          .insert({
            user_id: userId,
            quote: 'Believe in yourself and exceed your limits!',
          });

        if (quoteInsertError) throw quoteInsertError;
      }
    } else {
      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      const trainerId = admins && admins.length > 0 ? admins[0].id : null;
      const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update({
          username: name,
          email,
          telegram_id: telegramId || undefined,
          ...(trainerId ? { trainer_id: trainerId } : {}),
        })
        .eq('id', userId);

      if (updateProfileError) throw updateProfileError;
    }

    const fullRegistration = {
      user_id: userId,
      name,
      age,
      height,
      weight,
      email,
      phone,
      telegram_id: telegramId,
      workout_split: split,
      program_name: programName,
      duration_months: durationMonths,
      program_price: programPrice,
      payment_method: paymentMethod,
      status: 'pending',
      payment_status: 'pending',
      notes,
      photo_front,
      photo_back,
      photo_side,
      payment_screenshot,
    };

    // --- Insert registration record. Fall back to the original table shape if
    // the v2 migration has not been applied yet.
    let { error: regError } = await supabaseAdmin
      .from('program_registrations')
      .insert(fullRegistration);

    if (regError) {
      const fallbackRegistration = {
        user_id: userId,
        name,
        age,
        height,
        weight,
        email,
        phone,
        workout_split: split,
        program_name: programName,
        notes,
        photo_front,
        photo_back,
        photo_side,
        payment_screenshot,
      };
      const fallback = await supabaseAdmin
        .from('program_registrations')
        .insert(fallbackRegistration);
      regError = fallback.error;
    }

    if (regError) throw regError;

    await notifyAdminsPayment(fullRegistration, appBaseUrl(request)).catch(() => null);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save registration error:', err);
    return NextResponse.json(
      { error: 'ဖောင်သိမ်းဆည်းရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။ ' + err.message },
      { status: 500 }
    );
  }
}
