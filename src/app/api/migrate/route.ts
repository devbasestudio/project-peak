import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const sqlPath = path.join(process.cwd(), 'migrate.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s !== 'USE `project_peak`');

    const results: string[] = [];
    let success = 0;
    let errors = 0;

    for (const stmt of statements) {
      // Clean comments from statement
      const cleanStmt = stmt
        .split('\n')
        .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('#'))
        .join('\n')
        .trim();

      if (!cleanStmt) continue;

      try {
        await query(cleanStmt);
        success++;
      } catch (err: any) {
        const msg = err.message || '';
        if (msg.includes('already exists') || msg.includes('Duplicate column') || msg.includes('Duplicate key')) {
          results.push(`SKIP: ${cleanStmt.substring(0, 60)}...`);
        } else {
          results.push(`ERROR: ${msg} | SQL: ${cleanStmt.substring(0, 80)}`);
          errors++;
        }
      }
    }

    // Verify
    let tables: any[] = [];
    let exerciseCount = 0;
    let nutritionCount = 0;
    try {
      tables = await query('SHOW TABLES');
      const ec = await query('SELECT COUNT(*) as c FROM exercise_library');
      exerciseCount = ec[0]?.c || 0;
      const nc = await query('SELECT COUNT(*) as c FROM nutrition_items');
      nutritionCount = nc[0]?.c || 0;
    } catch (e: any) {
      results.push(`VERIFY ERROR: ${e.message}`);
    }

    return NextResponse.json({
      success: true,
      statementsExecuted: success,
      errors,
      logs: results,
      tables: tables.map((t: any) => Object.values(t)[0]),
      exerciseCount,
      nutritionCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
