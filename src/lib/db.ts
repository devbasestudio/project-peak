import { createClient } from '@/utils/supabase/server';

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const supabase = await createClient();
  const normalizedSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  try {
    // 1. SELECT * FROM users / SELECT username... FROM users WHERE id = ?
    if (normalizedSql.includes('from users') && normalizedSql.includes('where id =')) {
      const userId = params[0];
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, role, email, onboarding_complete')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return (profile ? [profile] : []) as any;
    }

    // 2. SELECT * FROM user_profiles WHERE user_id = ?
    if (normalizedSql.includes('from user_profiles') && normalizedSql.includes('where user_id =')) {
      const userId = params[0];
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return (profile ? [profile] : []) as any;
    }

    // 3. SELECT * FROM programs WHERE user_id = ?
    if (normalizedSql.includes('from programs') && normalizedSql.includes('where user_id =')) {
      const userId = params[0];
      const { data: programs, error } = await supabase
        .from('programs')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return (programs || []) as any;
    }

    // 4. SELECT quote FROM motivational_quotes WHERE user_id = ?
    if (normalizedSql.includes('from motivational_quotes') && normalizedSql.includes('where user_id =')) {
      const userId = params[0];
      const { data: quotes, error } = await supabase
        .from('motivational_quotes')
        .select('quote')
        .eq('user_id', userId);

      if (error) throw error;
      return (quotes || []) as any;
    }

    // 5. SELECT * FROM daily_trackers WHERE user_id = ? AND date = ?
    if (
      normalizedSql.includes('from daily_trackers') &&
      normalizedSql.includes('where user_id =') &&
      normalizedSql.includes('date =') &&
      !normalizedSql.includes('order by') &&
      !normalizedSql.includes('>=')
    ) {
      const userId = params[0];
      const date = params[1];
      const { data: trackers, error } = await supabase
        .from('daily_trackers')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date);

      if (error) throw error;
      return (trackers || []) as any;
    }

    // 6. SELECT split_name, is_rest FROM weekly_schedule WHERE user_id = ? AND day_of_week = ?
    if (
      normalizedSql.includes('from weekly_schedule') &&
      normalizedSql.includes('where user_id =') &&
      normalizedSql.includes('day_of_week =')
    ) {
      const userId = params[0];
      const dayOfWeek = params[1];
      const { data: schedules, error } = await supabase
        .from('weekly_schedule')
        .select('split_name, is_rest')
        .eq('user_id', userId)
        .eq('day_of_week', dayOfWeek);

      if (error) throw error;
      return (schedules || []) as any;
    }

    // 7. SELECT id, calories FROM nutrition_items WHERE program_type = ?
    if (
      normalizedSql.includes('from nutrition_items') &&
      normalizedSql.includes('where program_type =') &&
      !normalizedSql.includes('meal_type =')
    ) {
      const programType = params[0];
      const { data: items, error } = await supabase
        .from('nutrition_items')
        .select('*')
        .eq('program_type', programType)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (items || []) as any;
    }

    // 7b. SELECT * FROM nutrition_items WHERE program_type = ? AND meal_type = ?
    if (
      normalizedSql.includes('from nutrition_items') &&
      normalizedSql.includes('program_type =') &&
      normalizedSql.includes('meal_type =')
    ) {
      const programType = params[0];
      const mealType = params[1];
      const { data: items, error } = await supabase
        .from('nutrition_items')
        .select('*')
        .eq('program_type', programType)
        .eq('meal_type', mealType)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (items || []) as any;
    }

    // 8. JOIN nutrition_items... SELECT nl.nutrition_item_id, ni.calories, ni.protein_g, ni.carbs_g, ni.fat_g FROM nutrition_logs ...
    if (normalizedSql.includes('from nutrition_logs') && normalizedSql.includes('join nutrition_items')) {
      const userId = params[0];
      const date = params[1];
      
      const { data: logs, error } = await supabase
        .from('nutrition_logs')
        .select(`
          nutrition_item_id,
          completed,
          nutrition_items (
            calories,
            protein_g,
            carbs_g,
            fat_g
          )
        `)
        .eq('user_id', userId)
        .eq('date', date)
        .eq('completed', true);

      if (error) throw error;

      return (logs || []).map((l: any) => ({
        nutrition_item_id: l.nutrition_item_id,
        calories: l.nutrition_items?.calories || 0,
        protein_g: l.nutrition_items?.protein_g || 0,
        carbs_g: l.nutrition_items?.carbs_g || 0,
        fat_g: l.nutrition_items?.fat_g || 0,
      })) as any;
    }

    // 9. SELECT date, body_weight, steps, water_3l, omega_3, bed_phone_filter, toilet FROM daily_trackers WHERE user_id = ? ORDER BY date DESC
    if (normalizedSql.includes('from daily_trackers') && normalizedSql.includes('order by date desc')) {
      const userId = params[0];
      const { data: trackers, error } = await supabase
        .from('daily_trackers')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      return (trackers || []) as any;
    }

    // 10. SELECT date, body_weight FROM daily_trackers WHERE user_id = ? AND body_weight IS NOT NULL ORDER BY date ASC LIMIT 14
    if (
      normalizedSql.includes('from daily_trackers') &&
      normalizedSql.includes('body_weight is not null') &&
      normalizedSql.includes('limit 14')
    ) {
      const userId = params[0];
      const { data: trackers, error } = await supabase
        .from('daily_trackers')
        .select('date, body_weight')
        .eq('user_id', userId)
        .not('body_weight', 'is', null)
        .order('date', { ascending: true })
        .limit(14);

      if (error) throw error;
      return (trackers || []) as any;
    }

    // 11. SELECT u.id, u.username... JOIN programs p ON u.id = p.user_id WHERE u.role = 'user'
    if (normalizedSql.includes('from users u') && normalizedSql.includes("where u.role = 'user'")) {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          email,
          programs (
            program_type,
            target_calories
          )
        `)
        .eq('role', 'user');

      if (error) throw error;

      return (profiles || []).map((d: any) => ({
        id: d.id,
        username: d.username,
        email: d.email,
        program_type: d.programs?.[0]?.program_type || null,
        target_calories: d.programs?.[0]?.target_calories || null,
      })) as any;
    }

    // 12. SELECT wc.id, wc.user_id... JOIN users u ON wc.user_id = u.id ORDER BY wc.created_at DESC
    if (normalizedSql.includes('from weekly_checkins wc') && normalizedSql.includes('join users u')) {
      const { data: checkins, error } = await supabase
        .from('weekly_checkins')
        .select(`
          id,
          user_id,
          week_number,
          avg_weight,
          created_at,
          profiles:user_id (
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (checkins || []).map((d: any) => ({
        id: d.id,
        user_id: d.user_id,
        username: d.profiles?.username || 'User',
        week_number: d.week_number,
        avg_weight: d.avg_weight,
        created_at: d.created_at,
      })) as any;
    }

    // 13. SELECT * FROM program_registrations ORDER BY created_at DESC
    if (normalizedSql.includes('from program_registrations')) {
      const { data: registrations, error } = await supabase
        .from('program_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (registrations || []) as any;
    }

    // 14. SELECT * FROM weekly_checkins WHERE user_id = ? ORDER BY week_number DESC
    if (normalizedSql.includes('from weekly_checkins') && normalizedSql.includes('where user_id =') && normalizedSql.includes('order by week_number')) {
      const userId = params[0];
      const ascending = normalizedSql.includes('asc');
      const { data: checkins, error } = await supabase
        .from('weekly_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('week_number', { ascending });

      if (error) throw error;
      return (checkins || []) as any;
    }

    // 15. SELECT AVG(body_weight) FROM daily_trackers WHERE user_id = ? AND date >= ? AND date <= ?
    if (normalizedSql.includes('avg(body_weight)') && normalizedSql.includes('date >=') && normalizedSql.includes('date <=')) {
      const userId = params[0];
      const startDate = params[1];
      const endDate = params[2];

      const { data: trackers, error } = await supabase
        .from('daily_trackers')
        .select('body_weight')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const weights = (trackers || []).map((d: any) => parseFloat(d.body_weight)).filter((w) => !isNaN(w));
      const avg = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : null;
      return [{ avg_weight: avg }] as any;
    }

    // 16. SELECT * FROM workouts WHERE user_id = ? AND date = ?
    if (normalizedSql.includes('from workouts') && normalizedSql.includes('where user_id =') && normalizedSql.includes('date =')) {
      const userId = params[0];
      const date = params[1];
      const { data: workouts, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date);

      if (error) throw error;
      return (workouts || []) as any;
    }

    // 16b. SELECT * FROM workouts WHERE id = ?
    if (normalizedSql.includes('from workouts') && normalizedSql.includes('where id =')) {
      const workoutId = params[0];
      const { data: workouts, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId);

      if (error) throw error;
      return (workouts || []) as any;
    }

    // 17. SELECT * FROM workout_exercises WHERE workout_id = ?
    if (normalizedSql.includes('from workout_exercises') && normalizedSql.includes('where workout_id =')) {
      const workoutId = params[0];
      const { data: exercises, error } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', workoutId)
        .order('id', { ascending: true });

      if (error) throw error;
      return (exercises || []) as any;
    }

    // 18. SELECT el.id, el.exercise_name... FROM exercise_library WHERE program_type = ? AND split_name = ?
    if (normalizedSql.includes('from exercise_library') && normalizedSql.includes('program_type =') && normalizedSql.includes('split_name =')) {
      const programType = params[0];
      const splitName = params[1];
      const { data: library, error } = await supabase
        .from('exercise_library')
        .select('*')
        .eq('program_type', programType)
        .eq('split_name', splitName)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (library || []) as any;
    }

    // 19. SELECT original_exercise_id, replacement_exercise_id FROM exercise_swaps WHERE user_id = ?
    if (normalizedSql.includes('from exercise_swaps') && normalizedSql.includes('where user_id =')) {
      const userId = params[0];
      const { data: swaps, error } = await supabase
        .from('exercise_swaps')
        .select('original_exercise_id, replacement_exercise_id')
        .eq('user_id', userId);

      if (error) throw error;
      return (swaps || []) as any;
    }

    // 20. SELECT * FROM nutrition_logs WHERE user_id = ? AND date = ?
    if (normalizedSql.includes('from nutrition_logs') && normalizedSql.includes('where user_id =') && normalizedSql.includes('date =')) {
      const userId = params[0];
      const date = params[1];
      const { data: logs, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date);

      if (error) throw error;
      return (logs || []) as any;
    }

    // 21. SELECT * FROM weekly_schedule WHERE user_id = ?
    if (
      normalizedSql.includes('from weekly_schedule') &&
      normalizedSql.includes('where user_id =') &&
      !normalizedSql.includes('day_of_week =')
    ) {
      const userId = params[0];
      const { data: schedules, error } = await supabase
        .from('weekly_schedule')
        .select('*')
        .eq('user_id', userId)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      return (schedules || []) as any;
    }

    // 22. INSERT INTO workouts (user_id, date, split_name) VALUES (?, ?, ?)
    if (normalizedSql.startsWith('insert into workouts')) {
      const userId = params[0];
      const date = params[1];
      const splitName = params[2];

      const { data, error } = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          date,
          split_name: splitName,
          completed: false,
        })
        .select('id')
        .single();

      if (error) throw error;
      return { insertId: data.id } as any;
    }

    // 23. INSERT INTO workout_exercises (workout_id, exercise_name, target_sets, target_reps) VALUES (?, ?, ?, ?)
    if (normalizedSql.startsWith('insert into workout_exercises')) {
      const workoutId = params[0];
      const exerciseName = params[1];
      const targetSets = params[2];
      const targetReps = params[3];

      const { data, error } = await supabase
        .from('workout_exercises')
        .insert({
          workout_id: workoutId,
          exercise_name: exerciseName,
          target_sets: targetSets,
          target_reps: targetReps,
        })
        .select('id')
        .single();

      if (error) throw error;
      return { insertId: data.id } as any;
    }

    // Fallback: Return empty list if query not intercepted
    console.warn('Unhandled SQL query intercepted in Supabase compatibility layer:', sql, params);
    return [] as any;
  } catch (err) {
    console.error('Error executing query in Supabase compatibility layer:', sql, err);
    throw err;
  }
}
export default query;
