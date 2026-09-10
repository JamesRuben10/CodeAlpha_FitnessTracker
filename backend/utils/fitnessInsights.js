const Activity = require('../models/Activity');
const User = require('../models/User');

const BADGES = [
  { key: 'first-step', title: 'First Step', description: 'Log your first activity', icon: '👟' },
  { key: 'three-day-streak', title: '3-Day Streak', description: 'Log activities for 3 consecutive days', icon: '🔥' },
  { key: 'seven-day-streak', title: '7-Day Streak', description: 'Log activities for 7 consecutive days', icon: '🔥' },
  { key: 'thirty-day-streak', title: '30-Day Streak', description: 'Log activities for 30 consecutive days', icon: '🔥' },
  { key: 'ten-k-steps', title: '10K Steps', description: 'Reach 10,000 steps in one day', icon: '🚶' },
  { key: 'calorie-burner', title: 'Calorie Burner', description: 'Burn 500+ calories in one workout', icon: '⚡' },
  { key: 'workout-warrior', title: 'Workout Warrior', description: 'Complete 5 workouts in one week', icon: '💪' },
  { key: 'week-streak', title: 'Week Streak', description: 'Log activities for 7 consecutive days', icon: '🏅' },
  { key: 'month-streak', title: 'Month Streak', description: 'Log activities for 30 consecutive days', icon: '🏆' }
];

const dayKey = date => new Date(date).toISOString().slice(0, 10);

const startOfWeek = date => {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  const day = result.getUTCDay();
  result.setUTCDate(result.getUTCDate() - (day === 0 ? 6 : day - 1));
  return result;
};

const getStreaks = activities => {
  const days = [...new Set(activities.map(activity => dayKey(activity.date)))].sort().reverse();
  if (!days.length) return { current: 0, best: 0, lastActivityDate: null };

  const today = new Date();
  const todayKey = dayKey(today);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = dayKey(yesterday);
  let current = 0;
  if (days[0] === todayKey || days[0] === yesterdayKey) {
    current = 1;
    for (let index = 1; index < days.length; index += 1) {
      const previous = new Date(`${days[index - 1]}T00:00:00.000Z`);
      const expected = new Date(previous);
      expected.setUTCDate(expected.getUTCDate() - 1);
      if (days[index] !== dayKey(expected)) break;
      current += 1;
    }
  }

  let best = 0;
  let run = 0;
  const ascending = [...days].reverse();
  ascending.forEach((day, index) => {
    if (index === 0) run = 1;
    else {
      const previous = new Date(`${ascending[index - 1]}T00:00:00.000Z`);
      previous.setUTCDate(previous.getUTCDate() + 1);
      run = day === dayKey(previous) ? run + 1 : 1;
    }
    best = Math.max(best, run);
  });
  return { current, best, lastActivityDate: new Date(`${days[0]}T00:00:00.000Z`) };
};

const getWeekSummary = activities => activities.reduce((summary, activity) => ({
  calories: summary.calories + activity.caloriesBurned,
  steps: summary.steps + (activity.steps || 0),
  workouts: summary.workouts + 1,
  minutes: summary.minutes + activity.duration
}), { calories: 0, steps: 0, workouts: 0, minutes: 0 });

const getAchievements = activities => {
  const streak = getStreaks(activities);
  const dayTotals = new Map();
  const weekTotals = new Map();
  activities.forEach(activity => {
    const day = dayKey(activity.date);
    dayTotals.set(day, (dayTotals.get(day) || 0) + (activity.steps || 0));
    const week = startOfWeek(activity.date).toISOString();
    weekTotals.set(week, (weekTotals.get(week) || 0) + 1);
  });
  const earned = new Set(['first-step']);
  if (streak.best >= 3) earned.add('three-day-streak');
  if (streak.best >= 7) earned.add('seven-day-streak');
  if (streak.best >= 30) earned.add('thirty-day-streak');
  if ([...dayTotals.values()].some(total => total >= 10000)) earned.add('ten-k-steps');
  if (activities.some(activity => activity.caloriesBurned >= 500)) earned.add('calorie-burner');
  if ([...weekTotals.values()].some(total => total >= 5)) earned.add('workout-warrior');
  if (streak.best >= 7) earned.add('week-streak');
  if (streak.best >= 30) earned.add('month-streak');
  return BADGES.filter(badge => earned.has(badge.key));
};

const refreshUserInsights = async userId => {
  const activities = await Activity.find({ user: userId }).sort({ date: -1 }).lean();
  const user = await User.findById(userId);
  const known = new Map((user.achievements || []).map(achievement => [achievement.key, achievement]));
  getAchievements(activities).forEach(badge => {
    if (!known.has(badge.key)) known.set(badge.key, { ...badge, earnedAt: new Date() });
  });
  user.achievements = [...known.values()];
  user.streak = getStreaks(activities);
  await user.save();
  return { user, activities };
};

module.exports = { BADGES, dayKey, startOfWeek, getStreaks, getWeekSummary, refreshUserInsights };