const router = require('express').Router();
const Activity = require('../models/Activity');
const WeeklyChallenge = require('../models/WeeklyChallenge');
const { protect } = require('../middleware/auth');
const { startOfWeek, getWeekSummary, refreshUserInsights } = require('../utils/fitnessInsights');

const challengeTemplates = [
  { title: 'Walk 50,000 steps this week', type: 'steps', target: 50000 },
  { title: 'Burn 3,000 calories this week', type: 'calories', target: 3000 },
  { title: 'Complete 5 workouts this week', type: 'workouts', target: 5 },
  { title: 'Be active for 150 minutes this week', type: 'minutes', target: 150 }
];

const getChallenge = async (userId, weekStart, summary) => {
  const weekNumber = Math.floor(weekStart.getTime() / 604800000);
  const template = challengeTemplates[Math.abs(weekNumber) % challengeTemplates.length];
  let challenge = await WeeklyChallenge.findOneAndUpdate(
    { user: userId, weekStart },
    { $setOnInsert: { ...template, user: userId, weekStart } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const progress = summary[template.type];
  if (challenge.progress !== progress || challenge.completed !== progress >= challenge.target) {
    challenge.progress = progress;
    challenge.completed = progress >= challenge.target;
    if (challenge.completed && !challenge.completedAt) challenge.completedAt = new Date();
    await challenge.save();
  }
  return challenge;
};

// @route   POST /api/activities
// @desc    Add new activity
router.post('/', protect, async (req, res) => {
  try {
    const { exerciseType, duration, caloriesBurned, steps, distance, date, notes } = req.body;
    
    const activity = new Activity({
      user: req.user.id,
      exerciseType,
      duration,
      caloriesBurned,
      steps: steps || 0,
      distance: distance || 0,
      date: date || Date.now(),
      notes
    });

    const savedActivity = await activity.save();
    const { user } = await refreshUserInsights(req.user.id);
    res.status(201).json({ activity: savedActivity, achievements: user.achievements, streak: user.streak });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/activities
// @desc    Get all user activities
router.get('/', protect, async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user.id })
      .sort({ date: -1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/activities/week
// @desc    Get weekly summary
router.get('/week', protect, async (req, res) => {
  try {
    const { user } = await refreshUserInsights(req.user.id);
    const currentWeekStart = startOfWeek(new Date());
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setUTCDate(previousWeekStart.getUTCDate() - 7);
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setUTCDate(nextWeekStart.getUTCDate() + 7);
    const activities = await Activity.find({
      user: req.user.id,
      date: { $gte: previousWeekStart, $lt: nextWeekStart }
    }).sort({ date: -1 });

    const currentActivities = activities.filter(activity => activity.date >= currentWeekStart);
    const previousActivities = activities.filter(activity => activity.date < currentWeekStart);
    const summary = getWeekSummary(currentActivities);
    const previousSummary = getWeekSummary(previousActivities);
    const challenge = await getChallenge(req.user.id, currentWeekStart, summary);

    // Calculate summary
    // Group by date for chart
    const dateMap = new Map();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    currentActivities.forEach(activity => {
      const dateKey = new Date(activity.date).toDateString();
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { calories: 0, duration: 0, steps: 0, count: 0 });
      }
      const day = dateMap.get(dateKey);
      day.calories += activity.caloriesBurned;
      day.duration += activity.duration;
      day.steps += activity.steps || 0;
      day.count += 1;
    });

    const chartData = Array.from(dateMap.entries()).map(([date, data]) => ({
      date,
      ...data
    }));

    res.json({
      summary: {
        totalCalories: summary.calories,
        totalWorkouts: summary.workouts,
        totalSteps: summary.steps,
        totalDuration: summary.minutes,
        averageCalories: summary.workouts > 0 ? Math.round(summary.calories / summary.workouts) : 0
      },
      previousSummary: {
        totalCalories: previousSummary.calories,
        totalWorkouts: previousSummary.workouts,
        totalSteps: previousSummary.steps,
        totalDuration: previousSummary.minutes
      },
      chartData,
      activities: currentActivities,
      challenge,
      achievements: user.achievements || [],
      streak: user.streak || { current: 0, best: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/insights', protect, async (req, res) => {
  const { user } = await refreshUserInsights(req.user.id);
  res.json({ achievements: user.achievements, streak: user.streak });
});

router.get('/challenge', protect, async (req, res) => {
  const currentWeekStart = startOfWeek(new Date());
  const activities = await Activity.find({ user: req.user.id, date: { $gte: currentWeekStart } }).lean();
  res.json(await getChallenge(req.user.id, currentWeekStart, getWeekSummary(activities)));
});

// @route   PUT /api/activities/:id
// @desc    Update activity
router.put('/:id', protect, async (req, res) => {
  try {
    let activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Check ownership
    if (activity.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    activity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    await refreshUserInsights(req.user.id);

    res.json(activity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/activities/:id
// @desc    Delete activity
router.delete('/:id', protect, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Check ownership
    if (activity.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await activity.deleteOne();
  await refreshUserInsights(req.user.id);
    res.json({ message: 'Activity removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;