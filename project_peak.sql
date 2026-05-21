-- phpMyAdmin SQL Dump
-- version 5.2.1
-- Host: 127.0.0.1:3307
-- Generation Time: May 10, 2026
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `project_peak`
--
CREATE DATABASE IF NOT EXISTS `project_peak` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `project_peak`;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `trainer_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `trainer_id` (`trainer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`username`, `email`, `password`, `role`, `trainer_id`) VALUES
('Admin Trainer', 'admin@projectpeak.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NULL), -- password: password
('Test User', 'user@projectpeak.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 1);

-- --------------------------------------------------------

--
-- Table structure for table `programs`
--

CREATE TABLE `programs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `duration_weeks` int(11) NOT NULL DEFAULT 12,
  `target_calories` int(11) DEFAULT NULL,
  `macros_p` int(11) DEFAULT NULL,
  `macros_c` int(11) DEFAULT NULL,
  `macros_f` int(11) DEFAULT NULL,
  `start_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `daily_trackers`
--

CREATE TABLE `daily_trackers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `body_weight` decimal(5,2) DEFAULT NULL,
  `steps` int(11) DEFAULT NULL,
  `sleep_score` int(11) DEFAULT NULL,
  `water_3l` tinyint(1) DEFAULT 0,
  `omega_3` tinyint(1) DEFAULT 0,
  `bed_phone_filter` tinyint(1) DEFAULT 0,
  `meal_plan_adhered` tinyint(1) DEFAULT 0,
  `toilet` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_date` (`user_id`,`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `journaling`
--

CREATE TABLE `journaling` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `diet_status` enum('over','under','ok') DEFAULT NULL,
  `satisfied_with` text DEFAULT NULL,
  `difficult_with` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_date` (`user_id`,`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workouts`
--

CREATE TABLE `workouts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `split_name` varchar(100) NOT NULL,
  `completed` tinyint(1) DEFAULT 0,
  `user_notes` text DEFAULT NULL,
  `user_feelings` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workout_exercises`
--

CREATE TABLE `workout_exercises` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workout_id` int(11) NOT NULL,
  `exercise_name` varchar(255) NOT NULL,
  `target_sets` int(11) DEFAULT NULL,
  `target_reps` varchar(50) DEFAULT NULL,
  `actual_weight` varchar(50) DEFAULT NULL,
  `actual_reps` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `workout_id` (`workout_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `weekly_checkins`
--

CREATE TABLE `weekly_checkins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `week_number` int(11) NOT NULL,
  `avg_weight` decimal(5,2) DEFAULT NULL,
  `progress_photo_url` varchar(255) DEFAULT NULL,
  `energy_workout` int(11) DEFAULT NULL,
  `energy_workout_notes` text DEFAULT NULL,
  `energy_daily` int(11) DEFAULT NULL,
  `energy_daily_notes` text DEFAULT NULL,
  `motivation` int(11) DEFAULT NULL,
  `motivation_notes` text DEFAULT NULL,
  `struggle_notes` text DEFAULT NULL,
  `improvement_notes` text DEFAULT NULL,
  `upcoming_disruptions` text DEFAULT NULL,
  `changes_wanted` text DEFAULT NULL,
  `admin_feedback` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_week` (`user_id`,`week_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `motivational_quotes`
--

CREATE TABLE `motivational_quotes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `quote` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Constraints for dumped tables
--

ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`trainer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `programs`
  ADD CONSTRAINT `programs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `daily_trackers`
  ADD CONSTRAINT `daily_trackers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `journaling`
  ADD CONSTRAINT `journaling_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `workouts`
  ADD CONSTRAINT `workouts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `workout_exercises`
  ADD CONSTRAINT `workout_exercises_ibfk_1` FOREIGN KEY (`workout_id`) REFERENCES `workouts` (`id`) ON DELETE CASCADE;

ALTER TABLE `weekly_checkins`
  ADD CONSTRAINT `weekly_checkins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `motivational_quotes`
  ADD CONSTRAINT `motivational_quotes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
