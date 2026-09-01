export type WeeklyScheduleDay = {
  id: string;
  dayNumber: number;
  dayType: string;
  titleMm: string | null;
  titleEn: string | null;
  scheduledDate: string | null;
  completed: boolean;
};

export function getCurrentProgramWeek(completedSessions: number) {
  return Math.min(12, Math.floor(completedSessions / 4) + 1);
}

export function getWeekDayRange(weekNumber: number) {
  const firstDay = (weekNumber - 1) * 4 + 1;
  return { firstDay, lastDay: firstDay + 3 };
}

