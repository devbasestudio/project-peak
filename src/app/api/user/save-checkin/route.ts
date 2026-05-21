import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const session = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    // Determine target user
    let targetUserId = session.userId;
    if (session.role === 'admin' && formData.get('client_id')) {
      targetUserId = parseInt(formData.get('client_id') as string, 10);
    } else if (session.role !== 'user') {
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
    const existing = await query(
      'SELECT progress_photo_url FROM weekly_checkins WHERE user_id = ? AND week_number = ?',
      [targetUserId, week_number]
    );
    let progress_photo_url = existing && existing.length > 0 ? existing[0].progress_photo_url : null;

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
    await query(
      `INSERT INTO weekly_checkins 
       (user_id, week_number, avg_weight, progress_photo_url, energy_workout, energy_workout_notes, energy_daily, energy_daily_notes, motivation, motivation_notes, struggle_notes, improvement_notes, upcoming_disruptions, changes_wanted) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       avg_weight = VALUES(avg_weight), 
       progress_photo_url = VALUES(progress_photo_url), 
       energy_workout = VALUES(energy_workout), 
       energy_workout_notes = VALUES(energy_workout_notes), 
       energy_daily = VALUES(energy_daily), 
       energy_daily_notes = VALUES(energy_daily_notes), 
       motivation = VALUES(motivation), 
       motivation_notes = VALUES(motivation_notes), 
       struggle_notes = VALUES(struggle_notes), 
       improvement_notes = VALUES(improvement_notes), 
       upcoming_disruptions = VALUES(upcoming_disruptions), 
       changes_wanted = VALUES(changes_wanted)`,
      [
        targetUserId,
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
        changes_wanted
      ]
    );

    return NextResponse.json({ success: true, progress_photo_url });
  } catch (err: any) {
    console.error('Save check-in error:', err);
    return NextResponse.json({ error: 'Failed to save check-in: ' + err.message }, { status: 500 });
  }
}
