import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Instantiate Supabase Admin Client using Service Role Key (with fallbacks to prevent build-time crashes)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = (formData.get('username') as string) || '';
    const age = parseInt((formData.get('age') as string) || '0', 10);
    const height = (formData.get('height') as string) || '';
    const weight = parseFloat((formData.get('weight') as string) || '0');
    const email = (formData.get('email') as string) || '';
    const phone = (formData.get('phone') as string) || '';
    const split = (formData.get('workout_split') as string) || '';
    const notes = (formData.get('notes') as string) || '';

    const photoFrontFile = formData.get('photo_front') as File | null;
    const photoBackFile = formData.get('photo_back') as File | null;
    const photoSideFile = formData.get('photo_side') as File | null;
    const paymentScreenshotFile = formData.get('payment_screenshot') as File | null;

    // Handle file uploads
    const uploadDir = path.join(process.cwd(), 'public', 'user', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    async function saveFile(file: File | null, prefix: string) {
      if (!file || file.size === 0) return null;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path.join(uploadDir, filename);
      
      await fs.writeFile(filePath, buffer);
      return `user/uploads/${filename}`;
    }

    const photo_front = await saveFile(photoFrontFile, 'photo_front');
    const photo_back = await saveFile(photoBackFile, 'photo_back');
    const photo_side = await saveFile(photoSideFile, 'photo_side');
    const payment_screenshot = await saveFile(paymentScreenshotFile, 'payment_screenshot');

    // Check if email already exists in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    let userId = existingProfile ? existingProfile.id : null;

    if (!userId) {
      // Create new user account automatically with password = phone
      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);
        
      const trainerId = admins && admins.length > 0 ? admins[0].id : null;

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: phone, // phone is the default password
        email_confirm: true,
        user_metadata: {
          username: name,
        },
      });

      if (createError) throw createError;
      userId = newUser.user.id;

      if (userId) {
        // Trigger handle_new_user executes automatically to create profiles record.
        // We update trainer_id on profiles.
        if (trainerId) {
          const { error: updateProfileError } = await supabaseAdmin
            .from('profiles')
            .update({ trainer_id: trainerId })
            .eq('id', userId);
            
          if (updateProfileError) throw updateProfileError;
        }

        // Create default program (12 weeks)
        const today = new Date().toISOString().split('T')[0];
        const { error: programInsertError } = await supabaseAdmin
          .from('programs')
          .insert({
            user_id: userId,
            duration_weeks: 12,
            start_date: today,
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
    }

    // Insert into program_registrations
    const { error: regError } = await supabaseAdmin
      .from('program_registrations')
      .insert({
        user_id: userId,
        name,
        age,
        height,
        weight,
        email,
        phone,
        workout_split: split,
        notes,
        photo_front,
        photo_back,
        photo_side,
        payment_screenshot,
      });

    if (regError) throw regError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save registration error:', err);
    return NextResponse.json(
      { error: 'ဖောင်သိမ်းဆည်းရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။ ' + err.message },
      { status: 500 }
    );
  }
}
