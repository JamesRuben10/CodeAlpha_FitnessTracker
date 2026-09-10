const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exerciseType: {
    type: String,
    required: [true, 'Please add exercise type'],
    enum: ['Running', 'Walking', 'Cycling', 'Swimming', 'Weightlifting', 'Yoga', 'HIIT', 'Dancing', 'Other']
  },
  duration: {
    type: Number,
    required: [true, 'Please add duration in minutes'],
    min: 1
  },
  caloriesBurned: {
    type: Number,
    required: [true, 'Please add calories burned'],
    min: 0
  },
  steps: {
    type: Number,
    default: 0,
    min: 0
  },
  distance: {
    type: Number,
    default: 0,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: 500
  }
});

// Index for faster queries
ActivitySchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Activity', ActivitySchema);