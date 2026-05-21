import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Table initialization if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS \`program_registrations\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`user_id\` int(11) DEFAULT NULL,
        \`name\` varchar(100) NOT NULL,
        \`age\` int(11) NOT NULL,
        \`height\` varchar(50) NOT NULL,
        \`weight\` decimal(5,2) NOT NULL,
        \`email\` varchar(100) NOT NULL,
        \`phone\` varchar(50) NOT NULL,
        \`workout_split\` varchar(50) NOT NULL,
        \`notes\` text NOT NULL,
        \`photo_front\` varchar(255) DEFAULT NULL,
        \`photo_back\` varchar(255) DEFAULT NULL,
        \`photo_side\` varchar(255) DEFAULT NULL,
        \`payment_screenshot\` varchar(255) DEFAULT NULL,
        \`status\` enum('pending','approved') DEFAULT 'pending',
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

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

    // Check if email already exists in users table
    const existingUsers = await query('SELECT id FROM users WHERE email = ?', [email]);
    let userId = existingUsers && existingUsers.length > 0 ? existingUsers[0].id : null;

    if (!userId) {
      // Create new user account automatically with password = phone
      const hashedPassword = await bcrypt.hash(phone, 10);
      
      const admins = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
      const trainerId = admins && admins.length > 0 ? admins[0].id : null;

      const userInsert = await query(
        'INSERT INTO users (username, email, password, role, trainer_id) VALUES (?, ?, ?, "user", ?)',
        [name, email, hashedPassword, trainerId]
      );
      userId = userInsert.insertId;

      if (userId) {
        // Create default program (12 weeks)
        await query(
          'INSERT INTO programs (user_id, duration_weeks, start_date) VALUES (?, 12, CURDATE())',
          [userId]
        );

        // Add default motivational quote
        await query(
          "INSERT INTO motivational_quotes (user_id, quote) VALUES (?, 'Believe in yourself and exceed your limits!')",
          [userId]
        );
      }
    }

    // Insert into program_registrations
    await query(
      `INSERT INTO program_registrations 
       (user_id, name, age, height, weight, email, phone, workout_split, notes, photo_front, photo_back, photo_side, payment_screenshot) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        age,
        height,
        weight,
        email,
        phone,
        split,
        notes,
        photo_front,
        photo_back,
        photo_side,
        payment_screenshot
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save registration error:', err);
    return NextResponse.json(
      { error: 'ဖောင်သိမ်းဆည်းရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။ ' + err.message },
      { status: 500 }
    );
  }
}
