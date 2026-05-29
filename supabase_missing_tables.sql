-- =====================================================================
-- Project Peak — create the 6 tables that the Supabase migration missed.
-- Run this ONCE in Supabase Dashboard → SQL Editor (it is idempotent).
--
-- Missing tables that caused "A server error occurred" on /user/setup-profile
-- and the other inner pages:
--   user_profiles, weekly_schedule, nutrition_items,
--   nutrition_logs, exercise_library, exercise_swaps
--
-- user_id columns are UUID and reference public.profiles(id) to match the
-- existing tables (programs, daily_trackers, weekly_checkins, ...).
-- RLS is enabled with no policies — the app reaches these tables only through
-- the server-side service-role client, which bypasses RLS.
-- =====================================================================

-- ---------- USER PROFILES (onboarding baseline) ----------
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  height_cm         numeric(5,1),
  starting_weight   numeric(5,2),
  age               integer,
  body_fat_percent  integer,
  desired_body_text text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_user_id_key UNIQUE (user_id)
);

-- ---------- WEEKLY SCHEDULE (split per weekday) ----------
CREATE TABLE IF NOT EXISTS public.weekly_schedule (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL,           -- 0=Sun .. 6=Sat
  split_name  varchar(100),
  is_rest     boolean NOT NULL DEFAULT false,
  CONSTRAINT weekly_schedule_user_day_key UNIQUE (user_id, day_of_week)
);

-- ---------- EXERCISE LIBRARY (preset exercises) ----------
CREATE TABLE IF NOT EXISTS public.exercise_library (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  program_type   text NOT NULL,            -- skinnyfat_recomp | project_20 | mass_method
  split_name     varchar(100) NOT NULL,
  exercise_name  varchar(255) NOT NULL,
  muscle_group   varchar(100),
  sets_default   integer DEFAULT 3,
  reps_default   varchar(20) DEFAULT '8-12',
  rest_seconds   integer DEFAULT 90,
  form_video_url varchar(500),
  sort_order     integer DEFAULT 0
);

-- ---------- EXERCISE SWAPS (per-user replacements) ----------
CREATE TABLE IF NOT EXISTS public.exercise_swaps (
  id                       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id                  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_exercise_id     bigint NOT NULL REFERENCES public.exercise_library(id) ON DELETE CASCADE,
  replacement_exercise_id  bigint NOT NULL REFERENCES public.exercise_library(id) ON DELETE CASCADE,
  created_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exercise_swaps_user_orig_key UNIQUE (user_id, original_exercise_id)
);

-- ---------- NUTRITION ITEMS (preset meals) ----------
CREATE TABLE IF NOT EXISTS public.nutrition_items (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  program_type  text NOT NULL,             -- skinnyfat_recomp | project_20 | mass_method
  meal_type     text NOT NULL,             -- breakfast | lunch | snack | dinner | evening
  food_name     varchar(255) NOT NULL,
  food_name_mm  varchar(255),
  portion       varchar(100),
  calories      integer DEFAULT 0,
  protein_g     numeric(5,1) DEFAULT 0,
  carbs_g       numeric(5,1) DEFAULT 0,
  fat_g         numeric(5,1) DEFAULT 0,
  benefits_text text,
  sort_order    integer DEFAULT 0
);

-- ---------- NUTRITION LOGS (daily meal completion) ----------
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date              date NOT NULL,
  nutrition_item_id bigint NOT NULL REFERENCES public.nutrition_items(id) ON DELETE CASCADE,
  completed         boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nutrition_logs_user_date_item_key UNIQUE (user_id, date, nutrition_item_id)
);

-- ---------- Enable RLS (service-role client bypasses it) ----------
ALTER TABLE public.user_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_schedule  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_swaps   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs   ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- SEED: Exercise Library  (only inserts if the table is empty)
-- =====================================================================
INSERT INTO public.exercise_library (program_type,split_name,exercise_name,muscle_group,sets_default,reps_default,rest_seconds,sort_order)
SELECT * FROM (VALUES
  ('skinnyfat_recomp','Upper A','Barbell Bench Press','Chest',3,'8-10',120,1),
  ('skinnyfat_recomp','Upper A','Overhead Press','Shoulders',3,'8-10',90,2),
  ('skinnyfat_recomp','Upper A','Incline Dumbbell Press','Chest',3,'10-12',90,3),
  ('skinnyfat_recomp','Upper A','Lateral Raises','Shoulders',3,'12-15',60,4),
  ('skinnyfat_recomp','Upper A','Tricep Pushdowns','Triceps',3,'10-12',60,5),
  ('skinnyfat_recomp','Lower A','Barbell Squat','Quads',3,'6-8',120,1),
  ('skinnyfat_recomp','Lower A','Leg Press','Quads',3,'10-12',90,2),
  ('skinnyfat_recomp','Lower A','Romanian Deadlift','Hamstrings',3,'8-10',90,3),
  ('skinnyfat_recomp','Lower A','Leg Extension','Quads',3,'12-15',60,4),
  ('skinnyfat_recomp','Lower A','Calf Raises','Calves',4,'15-20',45,5),
  ('skinnyfat_recomp','Upper B','Barbell Row','Back',3,'8-10',120,1),
  ('skinnyfat_recomp','Upper B','Lat Pulldown','Back',3,'10-12',90,2),
  ('skinnyfat_recomp','Upper B','Face Pulls','Rear Delts',3,'12-15',60,3),
  ('skinnyfat_recomp','Upper B','Barbell Bicep Curl','Biceps',3,'10-12',60,4),
  ('skinnyfat_recomp','Upper B','Hammer Curls','Biceps',3,'10-12',60,5),
  ('skinnyfat_recomp','Lower B','Deadlift','Hamstrings',3,'5-6',150,1),
  ('skinnyfat_recomp','Lower B','Leg Curl','Hamstrings',3,'10-12',90,2),
  ('skinnyfat_recomp','Lower B','Hip Thrust','Glutes',3,'8-10',90,3),
  ('skinnyfat_recomp','Lower B','Walking Lunges','Quads',3,'12 each',60,4),
  ('skinnyfat_recomp','Lower B','Calf Raises','Calves',4,'15-20',45,5),
  ('project_20','Push','Barbell Bench Press','Chest',3,'10-12',90,1),
  ('project_20','Push','Dumbbell Shoulder Press','Shoulders',3,'10-12',90,2),
  ('project_20','Push','Cable Flyes','Chest',3,'12-15',60,3),
  ('project_20','Push','Lateral Raises','Shoulders',3,'15',60,4),
  ('project_20','Push','Tricep Dips','Triceps',3,'10-12',60,5),
  ('project_20','Pull','Pull-ups','Back',3,'8-10',90,1),
  ('project_20','Pull','Cable Rows','Back',3,'10-12',90,2),
  ('project_20','Pull','Face Pulls','Rear Delts',3,'12-15',60,3),
  ('project_20','Pull','Hammer Curls','Biceps',3,'10-12',60,4),
  ('project_20','Pull','Barbell Bicep Curl','Biceps',3,'10-12',60,5),
  ('project_20','Legs','Barbell Squat','Quads',3,'10-12',120,1),
  ('project_20','Legs','Leg Press','Quads',3,'12-15',90,2),
  ('project_20','Legs','Leg Curl','Hamstrings',3,'10-12',60,3),
  ('project_20','Legs','Walking Lunges','Quads',3,'12 each',60,4),
  ('project_20','Legs','Calf Raises','Calves',4,'15-20',45,5),
  ('project_20','Full Body','Incline Dumbbell Press','Chest',3,'10-12',90,1),
  ('project_20','Full Body','Barbell Row','Back',3,'10-12',90,2),
  ('project_20','Full Body','Overhead Press','Shoulders',3,'10-12',90,3),
  ('project_20','Full Body','Lateral Raises','Shoulders',3,'15',60,4),
  ('project_20','Full Body','Superset: Tricep/Bicep','Arms',3,'12 each',60,5),
  ('project_20','Cardio','Jump Squats','Full Body',3,'15',45,1),
  ('project_20','Cardio','Burpees','Full Body',3,'10',45,2),
  ('project_20','Cardio','Mountain Climbers','Core',3,'20 each',30,3),
  ('project_20','Cardio','Box Jumps','Legs',3,'12',45,4),
  ('project_20','Cardio','Battle Ropes','Full Body',3,'30 sec',30,5),
  ('mass_method','Chest & Triceps','Flat Barbell Bench Press','Chest',4,'6-8',150,1),
  ('mass_method','Chest & Triceps','Incline Dumbbell Press','Chest',3,'8-10',120,2),
  ('mass_method','Chest & Triceps','Cable Flyes','Chest',3,'10-12',90,3),
  ('mass_method','Chest & Triceps','Close Grip Bench Press','Triceps',3,'8-10',90,4),
  ('mass_method','Chest & Triceps','Tricep Pushdowns','Triceps',3,'10-12',60,5),
  ('mass_method','Back & Biceps','Deadlift','Back',4,'5-6',180,1),
  ('mass_method','Back & Biceps','Barbell Row','Back',3,'8-10',120,2),
  ('mass_method','Back & Biceps','Lat Pulldown','Back',3,'10-12',90,3),
  ('mass_method','Back & Biceps','Barbell Bicep Curl','Biceps',3,'8-10',90,4),
  ('mass_method','Back & Biceps','Hammer Curls','Biceps',3,'10-12',60,5),
  ('mass_method','Shoulders & Arms','Overhead Press','Shoulders',4,'6-8',120,1),
  ('mass_method','Shoulders & Arms','Lateral Raises','Shoulders',3,'12-15',60,2),
  ('mass_method','Shoulders & Arms','Face Pulls','Rear Delts',3,'12-15',60,3),
  ('mass_method','Shoulders & Arms','Skull Crushers','Triceps',3,'8-10',90,4),
  ('mass_method','Shoulders & Arms','Preacher Curl','Biceps',3,'10-12',60,5),
  ('mass_method','Legs','Barbell Squat','Quads',4,'6-8',180,1),
  ('mass_method','Legs','Leg Press','Quads',3,'10-12',120,2),
  ('mass_method','Legs','Romanian Deadlift','Hamstrings',3,'8-10',120,3),
  ('mass_method','Legs','Leg Extension','Quads',3,'12-15',60,4),
  ('mass_method','Legs','Leg Curl','Hamstrings',3,'10-12',60,5)
) AS v
WHERE NOT EXISTS (SELECT 1 FROM public.exercise_library);

-- =====================================================================
-- SEED: Nutrition Items  (only inserts if the table is empty)
-- =====================================================================
INSERT INTO public.nutrition_items (program_type,meal_type,food_name,food_name_mm,portion,calories,protein_g,carbs_g,fat_g,benefits_text,sort_order)
SELECT * FROM (VALUES
  ('skinnyfat_recomp','breakfast','Oatmeal with Banana & Whey Protein','အော့မီးနဲ့ ငှက်ပျောသီး + ပရိုတင်းမှုန့်','1 cup oats + 1 banana + 1 scoop',420,30,55,8,'Slow-release carbs for sustained energy. Banana provides potassium for muscle function. Whey protein kickstarts muscle protein synthesis.',1),
  ('skinnyfat_recomp','lunch','Grilled Chicken Breast with Brown Rice & Vegetables','ကြက်ရင်ဘတ်ကင် + ဆန်ညို + ဟင်းသီးဟင်းရွက်','200g chicken + 1 cup rice + veggies',520,42,52,10,'Lean protein for muscle repair. Brown rice for complex carbs. Vegetables for micronutrients and fiber.',2),
  ('skinnyfat_recomp','snack','Greek Yogurt with Almonds','ဂရိယိုဂတ် + ဗာဒံစေ့','200g yogurt + 15g almonds',220,18,12,10,'Probiotics for gut health. Casein protein for slow absorption. Almonds provide healthy fats and vitamin E.',3),
  ('skinnyfat_recomp','dinner','Grilled Fish with Sweet Potato & Salad','ငါးကင် + ကန်စွန်းဥ + သုပ်','200g fish + 1 medium potato + salad',440,38,40,10,'Omega-3 fatty acids from fish reduce inflammation. Sweet potato provides beta-carotene and complex carbs.',4),
  ('skinnyfat_recomp','evening','Whey Protein Shake','ပရိုတင်းရေ','1.5 scoops + water',200,36,4,3,'Fast-absorbing protein to prevent muscle breakdown overnight. Low calorie way to hit protein targets.',5),
  ('project_20','breakfast','Egg White Omelette with Spinach','ကြက်ဥအဖြူသားကြော် + ဟင်းနုနယ်ရွက်','5 egg whites + spinach + tomato',180,25,5,2,'High protein, very low calorie. Spinach provides iron and folate. Egg whites are pure protein with no fat.',1),
  ('project_20','lunch','Tuna Salad with Quinoa','ကျွဲထိုးသုပ် + ကွီးနိုးအား','1 can tuna + 0.5 cup quinoa + veggies',380,35,30,8,'Tuna is lean protein rich in omega-3. Quinoa is a complete protein with all essential amino acids.',2),
  ('project_20','snack','Apple with Peanut Butter','ပန်းသီး + မြေပဲထောပတ်','1 apple + 1 tbsp PB',200,5,28,8,'Apple fiber keeps you full. Peanut butter provides healthy fats. Great pre-workout snack for energy.',3),
  ('project_20','dinner','Lean Turkey with Steamed Vegetables','ကြက်ဆင်သားပြုတ် + ဟင်းသီးပေါင်း','200g turkey breast + mixed veggies',350,40,15,8,'Turkey is extremely lean protein. Steamed vegetables retain maximum nutrients. Low calorie but very filling.',4),
  ('project_20','evening','Casein Protein Shake','ပရိုတင်းရေ (Casein)','1 scoop + water',120,24,3,1,'Slow-digesting protein feeds muscles for 6-8 hours overnight. Prevents muscle catabolism during sleep.',5),
  ('mass_method','breakfast','4 Whole Eggs, Toast, Avocado & Oats','ကြက်ဥ ၄ လုံး + ပေါင်မုန့် + ထောပတ်သီး + အော့','4 eggs + 2 toast + half avocado + oats',720,35,65,32,'Whole eggs provide complete nutrition including cholesterol for testosterone. Avocado has healthy monounsaturated fats. Oats for sustained energy.',1),
  ('mass_method','lunch','Double Chicken Breast with White Rice & Vegetables','ကြက်ရင်ဘတ် ၂ ခု + ထမင်းဖြူ + ဟင်းသီး','400g chicken + 1.5 cups rice + veggies',750,60,75,12,'High protein for maximum muscle protein synthesis. White rice for fast-digesting carbs post-workout. Calorie dense.',2),
  ('mass_method','snack','Mass Gainer Shake: Banana, PB, Oats, Whey','ပရိုတင်းရေ + ငှက်ပျောသီး + မြေပဲထောပတ် + အော့','1 banana + 2 tbsp PB + oats + 2 scoops whey',550,40,55,18,'Calorie-dense shake for easy surplus. Combination of fast and slow carbs. High protein from whey.',3),
  ('mass_method','dinner','Beef Steak with Pasta & Side Salad','အမဲသားကင် + ခေါက်ဆွဲ + သုပ်','250g beef + 200g pasta + salad',680,45,60,22,'Red meat provides creatine, iron, zinc, and B12. Pasta provides calorie-dense carbs for glycogen replenishment.',4),
  ('mass_method','evening','Cottage Cheese with Mixed Nuts','ဒိန်ခဲ + အခွံမာသီးစုံ','200g cottage cheese + 30g mixed nuts',350,28,10,20,'Cottage cheese is rich in casein for overnight muscle feeding. Nuts provide healthy fats and extra calories.',5)
) AS v
WHERE NOT EXISTS (SELECT 1 FROM public.nutrition_items);
