import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || (user.email === 'admin@projectpeak.com' ? 'admin' : 'user');

    const formData = await request.formData();

    // Determine target user
    let targetUserId = user.id;
    if (userRole === 'admin' && formData.get('client_id')) {
      targetUserId = formData.get('client_id') as string;
    } else if (userRole !== 'user' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const week_number = parseInt(formData.get('week_number') as string, 10);
    const avg_weight = formData.get('avg_weight') ? parseFloat(formData.get('avg_weight') as string) : null;
    
    const energy_workout = formData.get('energy_workout') ? parseInt(formData.get('energy_workout') as string, 10) : null;
    const energy_workout_notes = (formData.get('energy_workout_notes') as string) || '';
    
    const energy_daily = formData.get('energy_daily') ? parseInt(formData.get('energy_daily') as string, 10) : null;
    const energy_daily_notes = (formData.get('energy_daily_notes') as string) || '';
    
    const motivation = formData.get('motivation') ? parseInt(formData.get('motivation') as string, 10) : null;
    const motivation_notes = (formData.get('motivation_notes') as string) || '';
    
    const struggle_notes = (formData.get('struggle_notes') as string) || '';
    const improvement_notes = (formData.get('improvement_notes') as string) || '';
    const upcoming_disruptions = (formData.get('upcoming_disruptions') as string) || '';
    const changes_wanted = (formData.get('changes_wanted') as string) || '';

    const progressPhotoFile = formData.get('progress_photo') as File | null;

    // Load existing check-in to preserve photo if not uploaded
    const { data: existing } = await supabase
      .from('weekly_checkins')
      .select('progress_photo_url')
      .eq('user_id', targetUserId)
      .eq('week_number', week_number)
      .single();
      
    let progress_photo_url = existing ? existing.progress_photo_url : null;

    // Handle file upload
    if (progressPhotoFile && progressPhotoFile.size > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'user', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });

      const bytes = await progressPhotoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const ext = progressPhotoFile.name.split('.').pop() || 'jpg';
      const filename = `progress_photo_${targetUserId}_w${week_number}_${Date.now()}.${ext}`;
      const filePath = path.join(uploadDir, filename);
      
      await fs.writeFile(filePath, buffer);
      progress_photo_url = `user/uploads/${filename}`;
    }

    // Save/Update Check-in
    const { error: checkinError } = await supabase
      .from('weekly_checkins')
      .upsert({
        user_id: targetUserId,
        week_number,
        avg_weight,
        progress_photo_url,
        energy_workout,
        energy_workout_notes,
        energy_daily,
        energy_daily_notes,
        motivation,
        motivation_notes,
        struggle_notes,
        improvement_notes,
        upcoming_disruptions,
        changes_wanted,
      }, { onConflict: 'user_id, week_number' });

    if (checkinError) throw checkinError;

    return NextResponse.json({ success: true, progress_photo_url });
  } catch (err: any) {
    console.error('Save check-in error:', err);
    return NextResponse.json({ error: 'Failed to save check-in: ' + err.message }, { status: 500 });
  }
}
