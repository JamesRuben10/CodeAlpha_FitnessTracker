import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AddActivity = () => {
  const [formData, setFormData] = useState({
    exerciseType: 'Running',
    duration: '',
    caloriesBurned: '',
    steps: '',
    distance: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const exerciseTypes = [
    'Running', 'Walking', 'Cycling', 'Swimming', 
    'Weightlifting', 'Yoga', 'HIIT', 'Dancing', 'Other'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/activities', {
        ...formData,
        duration: Number(formData.duration),
        caloriesBurned: Number(formData.caloriesBurned),
        steps: Number(formData.steps) || 0,
        distance: Number(formData.distance) || 0
      });

      const earned = response.data.achievements || [];
      const previousKeys = new Set((user?.achievements || []).map(badge => badge.key));
      const newBadges = earned.filter(badge => !previousKeys.has(badge.key));
      updateUser({ achievements: earned, streak: response.data.streak });
      if (newBadges.length) {
        window.alert(`New badge earned! ${newBadges.map(badge => `${badge.icon} ${badge.title}`).join(', ')}`);
      }
      
      setLoading(false);
      navigate('/activities');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add activity');
      setLoading(false);
    }
  };

  return (
    <div className="form-container activity-form-page">
      <aside className="activity-form-intro">
        <span className="activity-form-kicker">SESSION LOG</span>
        <h1>Make the work count.</h1>
        <p>Capture the details while they are fresh. Small entries become a clear picture of your progress.</p>
        <div className="activity-form-note">
          <span className="activity-form-note-mark">01</span>
          <span>Consistency beats intensity when it comes to lasting progress.</span>
        </div>
      </aside>
      <div className="form-card">
        <span className="form-kicker">NEW ENTRY</span>
        <h2>Log a workout</h2>
        <p className="form-subtitle">Track your fitness progress</p>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Exercise Type *</label>
            <select
              name="exerciseType"
              value={formData.exerciseType}
              onChange={handleChange}
              required
            >
              {exerciseTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Duration (minutes) *</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                placeholder="30"
                min="1"
              />
            </div>
            
            <div className="form-group">
              <label>Calories Burned *</label>
              <input
                type="number"
                name="caloriesBurned"
                value={formData.caloriesBurned}
                onChange={handleChange}
                required
                placeholder="200"
                min="0"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Steps</label>
              <input
                type="number"
                name="steps"
                value={formData.steps}
                onChange={handleChange}
                placeholder="5000"
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label>Distance (km)</label>
              <input
                type="number"
                name="distance"
                value={formData.distance}
                onChange={handleChange}
                placeholder="5.2"
                min="0"
                step="0.1"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="How did it go? Any achievements?"
              rows="3"
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigate('/activities')}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddActivity;