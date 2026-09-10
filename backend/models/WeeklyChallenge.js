const mongoose = require('mongoose');

const WeeklyChallengeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStart: { type: Date, required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['steps', 'calories', 'workouts', 'minutes'], required: true },
  target: { type: Number, required: true },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date }
}, { timestamps: true });

WeeklyChallengeSchema.index({ user: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyChallenge', WeeklyChallengeSchema);