USE `project_peak`;

-- Add onboarding flag to users
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `onboarding_complete` TINYINT(1) NOT NULL DEFAULT 0;

-- Add program type to programs
ALTER TABLE `programs` ADD COLUMN IF NOT EXISTS `program_type` ENUM('skinnyfat_recomp','project_20','mass_method') NOT NULL DEFAULT 'skinnyfat_recomp';

-- ============================================
-- USER PROFILES (onboarding starting point)
-- ============================================
CREATE TABLE IF NOT EXISTS `user_profiles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `height_cm` DECIMAL(5,1) DEFAULT NULL,
  `starting_weight` DECIMAL(5,2) DEFAULT NULL,
  `age` INT DEFAULT NULL,
  `body_fat_percent` INT DEFAULT NULL,
  `desired_body_text` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- WEEKLY SCHEDULE (which split on which day)
-- ============================================
CREATE TABLE IF NOT EXISTS `weekly_schedule` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `day_of_week` TINYINT NOT NULL COMMENT '0=Sun,1=Mon,...,6=Sat',
  `split_name` VARCHAR(100) DEFAULT NULL,
  `is_rest` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_day` (`user_id`, `day_of_week`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- EXERCISE LIBRARY (preset exercises per program)
-- ============================================
CREATE TABLE IF NOT EXISTS `exercise_library` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `program_type` ENUM('skinnyfat_recomp','project_20','mass_method') NOT NULL,
  `split_name` VARCHAR(100) NOT NULL,
  `exercise_name` VARCHAR(255) NOT NULL,
  `muscle_group` VARCHAR(100) DEFAULT NULL,
  `sets_default` INT DEFAULT 3,
  `reps_default` VARCHAR(20) DEFAULT '8-12',
  `rest_seconds` INT DEFAULT 90,
  `form_video_url` VARCHAR(500) DEFAULT NULL,
  `sort_order` INT DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- EXERCISE SWAPS (user-specific replacements)
-- ============================================
CREATE TABLE IF NOT EXISTS `exercise_swaps` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `original_exercise_id` INT NOT NULL,
  `replacement_exercise_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_orig` (`user_id`, `original_exercise_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`original_exercise_id`) REFERENCES `exercise_library`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`replacement_exercise_id`) REFERENCES `exercise_library`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- NUTRITION ITEMS (food items per program)
-- ============================================
CREATE TABLE IF NOT EXISTS `nutrition_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `program_type` ENUM('skinnyfat_recomp','project_20','mass_method') NOT NULL,
  `meal_type` ENUM('breakfast','lunch','snack','dinner','evening') NOT NULL,
  `food_name` VARCHAR(255) NOT NULL,
  `food_name_mm` VARCHAR(255) DEFAULT NULL,
  `portion` VARCHAR(100) DEFAULT NULL,
  `calories` INT DEFAULT 0,
  `protein_g` DECIMAL(5,1) DEFAULT 0,
  `carbs_g` DECIMAL(5,1) DEFAULT 0,
  `fat_g` DECIMAL(5,1) DEFAULT 0,
  `benefits_text` TEXT DEFAULT NULL,
  `sort_order` INT DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- NUTRITION LOGS (daily meal tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS `nutrition_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `nutrition_item_id` INT NOT NULL,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_date_item` (`user_id`, `date`, `nutrition_item_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`nutrition_item_id`) REFERENCES `nutrition_items`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- WORKOUT SESSIONS (timer tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS `workout_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `workout_id` INT DEFAULT NULL,
  `start_time` DATETIME DEFAULT NULL,
  `end_time` DATETIME DEFAULT NULL,
  `duration_seconds` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- SEED: Exercise Library
-- ============================================

-- SKINNYFAT RECOMP: Upper A (Push)
INSERT INTO `exercise_library` (`program_type`,`split_name`,`exercise_name`,`muscle_group`,`sets_default`,`reps_default`,`rest_seconds`,`sort_order`) VALUES
('skinnyfat_recomp','Upper A','Barbell Bench Press','Chest',3,'8-10',120,1),
('skinnyfat_recomp','Upper A','Overhead Press','Shoulders',3,'8-10',90,2),
('skinnyfat_recomp','Upper A','Incline Dumbbell Press','Chest',3,'10-12',90,3),
('skinnyfat_recomp','Upper A','Lateral Raises','Shoulders',3,'12-15',60,4),
('skinnyfat_recomp','Upper A','Tricep Pushdowns','Triceps',3,'10-12',60,5);

-- SKINNYFAT RECOMP: Lower A (Quad)
INSERT INTO `exercise_library` (`program_type`,`split_name`,`exercise_name`,`muscle_group`,`sets_default`,`reps_default`,`rest_seconds`,`sort_order`) VALUES
('skinnyfat_recomp','Lower A','Barbell Squat','Quads',3,'6-8',120,1),
('skinnyfat_recomp','Lower A','Leg Press','Quads',3,'10-12',90,2),
('skinnyfat_recomp','Lower A','Romanian Deadlift','Hamstrings',3,'8-10',90,3),
('skinnyfat_recomp','Lower A','Leg Extension','Quads',3,'12-15',60,4),
('skinnyfat_recomp','Lower A','Calf Raises','Calves',4,'15-20',45,5);

-- SKINNYFAT RECOMP: Upper B (Pull)
INSERT INTO `exercise_library` (`program_type`,`split_name`,`exercise_name`,`muscle_group`,`sets_default`,`reps_default`,`rest_seconds`,`sort_order`) VALUES
('skinnyfat_recomp','Upper B','Barbell Row','Back',3,'8-10',120,1),
('skinnyfat_recomp','Upper B','Lat Pulldown','Back',3,'10-12',90,2),
('skinnyfat_recomp','Upper B','Face Pulls','Rear Delts',3,'12-15',60,3),
('skinnyfat_recomp','Upper B','Barbell Bicep Curl','Biceps',3,'10-12',60,4),
('skinnyfat_recomp','Upper B','Hammer Curls','Biceps',3,'10-12',60,5);

-- SKINNYFAT RECOMP: Lower B (Hamstring)
INSERT INTO `exercise_library` (`program_type`,`split_name`,`exercise_name`,`muscle_group`,`sets_default`,`reps_default`,`rest_seconds`,`sort_order`) VALUES
('skinnyfat_recomp','Lower B','Deadlift','Hamstrings',3,'5-6',150,1),
('skinnyfat_recomp','Lower B','Leg Curl','Hamstrings',3,'10-12',90,2),
('skinnyfat_recomp','Lower B','Hip Thrust','Glutes',3,'8-10',90,3),
('skinnyfat_recomp','Lower B','Walking Lunges','Quads',3,'12 each',60,4),
('skinnyfat_recomp','Lower B','Calf Raises','Calves',4,'15-20',45,5);

-- PROJECT-20: Push
INSERT INTO `exercise_library` (`program_type`,`split_name`,`exercise_name`,`muscle_group`,`sets_default`,`reps_default`,`rest_seconds`,`sort_order`) VALUES
('project_20','Push','Barbell Bench Press','Chest',3,'10-12',90,1),
('project_20','Push','Dumbbell Shoulder Press','Shoulders',3,'10-12',90,2),
('project_20','Push','Cable Flyes','Chest',3,'12-15',60,3),
('project_20','Push','Lateral Raises','Shoulders',3,'15',60,4),
('project_20','Push','Tricep Dips','Triceps',3,'10-12',60,5);

-- PROJECT-20: Pull
INSERT INTO `exercise_library` (`program_type`,`split_name`,`exercise_name`,`muscle_group`,`sets_default`,`reps_default`,`rest_seconds`,`sort_order`) VALUES
('project_20','Pull','Pull-ups','Back',3,'8-10',90,1),
('project_20','Pull','Cable Rows','Back',3,'10-12',90,2),
('project_20','Pull','Face Pulls','Rear Delts',3,'12-15',60,3),
('project_20','Pull','Hammer Curls','Biceps',3,'10-12',60,4),
('project_20','Pull','Barbell Bicep Curl','Biceps',3,'10-12',60,5);

-- PROJECT-20: Legs
INSERT INTO `exercise_library` (`program_type`,`split_name`,`exercise_name`,`muscle_group`,`sets_default`,`reps_default`,`rest_seconds`,`sort_order`) VALUES
('project_20','Legs','Barbell Squat','Quads',3,'10-12',120,1),
('project_20','Legs','Leg Press','Quads',3,'12-15',90,2),
('project_20','Legs','Leg Curl','Hamstrings',3,'10-12',60,3),
('project_20','Legs','Walking Lunges','Quads',3,'12 each',60,4),
('project_20','Legs','Calf Raises','Calves',4,'15-20',45,5);

-- PROJECT-20: Full Body
INSERT INTO `exercise_library` (`program_type`,`split_name`,`exercise_name`,`muscle_group`,`sets_default`,`reps_default`,`rest_seconds`,`sort_order`) VALUES
('project_20','Full Body','Incline Dumbbell Press','Chest',3,'10-12',90,1),
('project_20','Full Body','Barbell Row','Back',3,'10-12',90,2),
('project_20','Full Body','Overhead Press','Shoulders',3,'10-12',90,3),
('project_20','Full Body','Lateral Raises','Shoulders',3,'15',60,4),
('project_20','Full Body','Superset: Tricep/Bicep','Arms',3,'12 each',60,5);

-- PROJECT-20: Cardio
INSERT INTO `exercise_library` (`program_type`,`split_name`,`exercise_name`,`muscle_group`,`sets_default`,`reps_default`,`rest_seconds`,`sort_order`) VALUES
('project_20','Cardio','Jump Squats','Full Body',3,'15',45,1),
('project_20','Cardio','Burpees','Full Body',3,'10',45,2),
('project_20','Cardio','Mountain Climbers','Core',3,'20 each',30,3),
('project_20','Cardio','Box Jumps','Legs',3,'12',45,4),
('project_20','Cardio','Battle Ropes','Full Body',3,'30 sec',30,5);

-- MASS METHOD: Chest & Triceps
INSERT INTO `exercise_library` (`program_type`,`split_name`,`exercise_name`,`muscle_group`,`sets_default`,`reps_default`,`rest_seconds`,`sort_order`) VALUES
('mass_method','Chest & Triceps','Flat Barbell Bench Press','Chest',4,'6-8',150,1),
('mass_method','Chest & Triceps','Incline Dumbbell Press','Chest',3,'8-10',120,2),
('mass_method','Chest & Triceps','Cable Flyes','Chest',3,'10-12',90,3),
('mass_method','Chest & Triceps','Close Grip Bench Press','Triceps',3,'8-10',90,4),
('mass_method','Chest & Triceps','Tricep Pushdowns','Triceps',3,'10-12',60,5);

-- MASS METHOD: Back & Biceps
INSERT INTO `exercise_library` (`program_type`,`split_name`,`exercise_name`,`muscle_group`,`sets_default`,`reps_default`,`rest_seconds`,`sort_order`) VALUES
('mass_method','Back & Biceps','Deadlift','Back',4,'5-6',180,1),
('mass_method','Back & Biceps','Barbell Row','Back',3,'8-10',120,2),
('mass_method','Back & Biceps','Lat Pulldown','Back',3,'10-12',90,3),
('mass_method','Back & Biceps','Barbell Bicep Curl','Biceps',3,'8-10',90,4),
('mass_method','Back & Biceps','Hammer Curls','Biceps',3,'10-12',60,5);

-- MASS METHOD: Shoulders & Arms
INSERT INTO `exercise_library` (`program_type`,`split_name`,`exercise_name`,`muscle_group`,`sets_default`,`reps_default`,`rest_seconds`,`sort_order`) VALUES
('mass_method','Shoulders & Arms','Overhead Press','Shoulders',4,'6-8',120,1),
('mass_method','Shoulders & Arms','Lateral Raises','Shoulders',3,'12-15',60,2),
('mass_method','Shoulders & Arms','Face Pulls','Rear Delts',3,'12-15',60,3),
('mass_method','Shoulders & Arms','Skull Crushers','Triceps',3,'8-10',90,4),
('mass_method','Shoulders & Arms','Preacher Curl','Biceps',3,'10-12',60,5);

-- MASS METHOD: Legs
INSERT INTO `exercise_library` (`program_type`,`split_name`,`exercise_name`,`muscle_group`,`sets_default`,`reps_default`,`rest_seconds`,`sort_order`) VALUES
('mass_method','Legs','Barbell Squat','Quads',4,'6-8',180,1),
('mass_method','Legs','Leg Press','Quads',3,'10-12',120,2),
('mass_method','Legs','Romanian Deadlift','Hamstrings',3,'8-10',120,3),
('mass_method','Legs','Leg Extension','Quads',3,'12-15',60,4),
('mass_method','Legs','Leg Curl','Hamstrings',3,'10-12',60,5);

-- ============================================
-- SEED: Nutrition Items
-- ============================================

-- SKINNYFAT RECOMP (~1800 kcal)
INSERT INTO `nutrition_items` (`program_type`,`meal_type`,`food_name`,`food_name_mm`,`portion`,`calories`,`protein_g`,`carbs_g`,`fat_g`,`benefits_text`,`sort_order`) VALUES
('skinnyfat_recomp','breakfast','Oatmeal with Banana & Whey Protein','အော့မီးနဲ့ ငှက်ပျောသီး + ပရိုတင်းမှုန့်','1 cup oats + 1 banana + 1 scoop',420,30,55,8,'Slow-release carbs for sustained energy. Banana provides potassium for muscle function. Whey protein kickstarts muscle protein synthesis.',1),
('skinnyfat_recomp','lunch','Grilled Chicken Breast with Brown Rice & Vegetables','ကြက်ရင်ဘတ်ကင် + ဆန်ညို + ဟင်းသီးဟင်းရွက်','200g chicken + 1 cup rice + veggies',520,42,52,10,'Lean protein for muscle repair. Brown rice for complex carbs. Vegetables for micronutrients and fiber.',2),
('skinnyfat_recomp','snack','Greek Yogurt with Almonds','ဂရိယိုဂတ် + ဗာဒံစေ့','200g yogurt + 15g almonds',220,18,12,10,'Probiotics for gut health. Casein protein for slow absorption. Almonds provide healthy fats and vitamin E.',3),
('skinnyfat_recomp','dinner','Grilled Fish with Sweet Potato & Salad','ငါးကင် + ကန်စွန်းဥ + သုပ်','200g fish + 1 medium potato + salad',440,38,40,10,'Omega-3 fatty acids from fish reduce inflammation. Sweet potato provides beta-carotene and complex carbs.',4),
('skinnyfat_recomp','evening','Whey Protein Shake','ပရိုတင်းရေ','1.5 scoops + water',200,36,4,3,'Fast-absorbing protein to prevent muscle breakdown overnight. Low calorie way to hit protein targets.',5);

-- PROJECT-20 (~1500 kcal)
INSERT INTO `nutrition_items` (`program_type`,`meal_type`,`food_name`,`food_name_mm`,`portion`,`calories`,`protein_g`,`carbs_g`,`fat_g`,`benefits_text`,`sort_order`) VALUES
('project_20','breakfast','Egg White Omelette with Spinach','ကြက်ဥအဖြူသားကြော် + ဟင်းနုနယ်ရွက်','5 egg whites + spinach + tomato',180,25,5,2,'High protein, very low calorie. Spinach provides iron and folate. Egg whites are pure protein with no fat.',1),
('project_20','lunch','Tuna Salad with Quinoa','ကျွဲထိုးသုပ် + ကွီးနိုးအား','1 can tuna + 0.5 cup quinoa + veggies',380,35,30,8,'Tuna is lean protein rich in omega-3. Quinoa is a complete protein with all essential amino acids.',2),
('project_20','snack','Apple with Peanut Butter','ပန်းသီး + မြေပဲထောပတ်','1 apple + 1 tbsp PB',200,5,28,8,'Apple fiber keeps you full. Peanut butter provides healthy fats. Great pre-workout snack for energy.',3),
('project_20','dinner','Lean Turkey with Steamed Vegetables','ကြက်ဆင်သားပြုတ် + ဟင်းသီးပေါင်း','200g turkey breast + mixed veggies',350,40,15,8,'Turkey is extremely lean protein. Steamed vegetables retain maximum nutrients. Low calorie but very filling.',4),
('project_20','evening','Casein Protein Shake','ပရိုတင်းရေ (Casein)','1 scoop + water',120,24,3,1,'Slow-digesting protein feeds muscles for 6-8 hours overnight. Prevents muscle catabolism during sleep.',5);

-- MASS METHOD (~2800 kcal)
INSERT INTO `nutrition_items` (`program_type`,`meal_type`,`food_name`,`food_name_mm`,`portion`,`calories`,`protein_g`,`carbs_g`,`fat_g`,`benefits_text`,`sort_order`) VALUES
('mass_method','breakfast','4 Whole Eggs, Toast, Avocado & Oats','ကြက်ဥ ၄ လုံး + ပေါင်မုန့် + ထောပတ်သီး + အော့','4 eggs + 2 toast + half avocado + oats',720,35,65,32,'Whole eggs provide complete nutrition including cholesterol for testosterone. Avocado has healthy monounsaturated fats. Oats for sustained energy.',1),
('mass_method','lunch','Double Chicken Breast with White Rice & Vegetables','ကြက်ရင်ဘတ် ၂ ခု + ထမင်းဖြူ + ဟင်းသီး','400g chicken + 1.5 cups rice + veggies',750,60,75,12,'High protein for maximum muscle protein synthesis. White rice for fast-digesting carbs post-workout. Calorie dense.',2),
('mass_method','snack','Mass Gainer Shake: Banana, PB, Oats, Whey','ပရိုတင်းရေ + ငှက်ပျောသီး + မြေပဲထောပတ် + အော့','1 banana + 2 tbsp PB + oats + 2 scoops whey',550,40,55,18,'Calorie-dense shake for easy surplus. Combination of fast and slow carbs. High protein from whey.',3),
('mass_method','dinner','Beef Steak with Pasta & Side Salad','အမဲသားကင် + ခေါက်ဆွဲ + သုပ်','250g beef + 200g pasta + salad',680,45,60,22,'Red meat provides creatine, iron, zinc, and B12. Pasta provides calorie-dense carbs for glycogen replenishment.',4),
('mass_method','evening','Cottage Cheese with Mixed Nuts','ဒိန်ခဲ + အခွံမာသီးစုံ','200g cottage cheese + 30g mixed nuts',350,28,10,20,'Cottage cheese is rich in casein for overnight muscle feeding. Nuts provide healthy fats and extra calories.',5);

-- Set program calorie defaults for existing test user
UPDATE `programs` SET `target_calories` = 1800, `macros_p` = 150, `macros_c` = 180, `macros_f` = 50 WHERE `program_type` = 'skinnyfat_recomp' AND `target_calories` IS NULL;

-- Ensure all existing users have a default program row if they don't have one
INSERT INTO `programs` (`user_id`, `duration_weeks`, `target_calories`, `macros_p`, `macros_c`, `macros_f`, `program_type`, `start_date`)
SELECT `id`, 12, 1800, 150, 180, 50, 'skinnyfat_recomp', CURDATE()
FROM `users`
WHERE `role` = 'user' AND `id` NOT IN (SELECT `user_id` FROM `programs`);

-- Add unique constraint on programs.user_id to enable ON DUPLICATE KEY UPDATE to work correctly
ALTER TABLE `programs` ADD UNIQUE KEY `unique_user_id` (`user_id`);

