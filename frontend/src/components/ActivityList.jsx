import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaPlus, FaBolt, FaClock, FaFire } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ActivityList = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/activities');
      setActivities(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load activities');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await axios.delete(`http://localhost:5000/api/activities/${id}`);
        setActivities(activities.filter(a => a._id !== id));
      } catch (error) {
        setError('Failed to delete activity');
      }
    }
  };

  const handleEdit = (activity) => {
    setEditingId(activity._id);
    setEditForm({
      exerciseType: activity.exerciseType,
      duration: activity.duration,
      caloriesBurned: activity.caloriesBurned,
      steps: activity.steps || 0,
      distance: activity.distance || 0,
      notes: activity.notes || ''
    });
  };

  const handleUpdate = async (id) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/activities/${id}`, {
        ...editForm,
        duration: Number(editForm.duration),
        caloriesBurned: Number(editForm.caloriesBurned),
        steps: Number(editForm.steps) || 0,
        distance: Number(editForm.distance) || 0
      });
      setActivities(activities.map(a => a._id === id ? res.data : a));
      setEditingId(null);
    } catch (error) {
      setError('Failed to update activity');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const totalMinutes = activities.reduce((total, activity) => total + Number(activity.duration || 0), 0);
  const totalCalories = activities.reduce((total, activity) => total + Number(activity.caloriesBurned || 0), 0);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading activities...</p>
      </div>
    );
  }

  return (
    <div className="activities-container">
      <div className="activities-header">
        <div>
          <span className="activities-kicker">TRAINING ARCHIVE</span>
          <h1>Your activities</h1>
          <p>Every session is a signal. Keep showing up.</p>
        </div>
        <button
          className="activities-add-button"
          onClick={() => navigate('/add-activity')}
        >
          <FaPlus /> Add activity
        </button>
      </div>

      {activities.length > 0 && (
        <div className="activity-overview">
          <div className="overview-item">
            <span className="overview-icon overview-icon-sessions"><FaBolt /></span>
            <span><strong>{activities.length}</strong><small>Sessions logged</small></span>
          </div>
          <div className="overview-item">
            <span className="overview-icon overview-icon-time"><FaClock /></span>
            <span><strong>{totalMinutes}m</strong><small>Time invested</small></span>
          </div>
          <div className="overview-item">
            <span className="overview-icon overview-icon-calories"><FaFire /></span>
            <span><strong>{totalCalories}</strong><small>Calories burned</small></span>
          </div>
        </div>
      )}
      
      {error && <div className="alert alert-error">{error}</div>}
      
      {activities.length === 0 ? (
        <div className="empty-state activity-empty-state">
          <span className="empty-state-mark"><FaBolt /></span>
          <h2>Your first session is waiting.</h2>
          <p>No activities logged yet. Start tracking your fitness!</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/add-activity')}
          >
            Log Your First Activity
          </button>
        </div>
      ) : (
        <div className="activities-list">
          {activities.map(activity => (
            <div key={activity._id} className="activity-card">
              {editingId === activity._id ? (
                // Edit Mode
                <div className="edit-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Type</label>
                      <select
                        value={editForm.exerciseType}
                        onChange={(e) => setEditForm({...editForm, exerciseType: e.target.value})}
                      >
                        {['Running', 'Walking', 'Cycling', 'Swimming', 'Weightlifting', 'Yoga', 'HIIT', 'Dancing', 'Other'].map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Duration (min)</label>
                      <input
                        type="number"
                        value={editForm.duration}
                        onChange={(e) => setEditForm({...editForm, duration: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Calories</label>
                      <input
                        type="number"
                        value={editForm.caloriesBurned}
                        onChange={(e) => setEditForm({...editForm, caloriesBurned: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Steps</label>
                      <input
                        type="number"
                        value={editForm.steps}
                        onChange={(e) => setEditForm({...editForm, steps: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="edit-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => handleUpdate(activity._id)}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="activity-icon">
                    <span style={{ fontSize: '2rem' }}>🏃</span>
                  </div>
                  <div className="activity-details">
                    <h3>{activity.exerciseType}</h3>
                    <p className="activity-meta">
                      {formatDate(activity.date)}
                    </p>
                    <div className="activity-stats">
                      <span>⏱️ {activity.duration}m</span>
                      <span>🔥 {activity.caloriesBurned} cal</span>
                      {activity.steps > 0 && <span>👟 {activity.steps} steps</span>}
                      {activity.distance > 0 && <span>📏 {activity.distance} km</span>}
                    </div>
                    {activity.notes && (
                      <p className="activity-notes">📝 {activity.notes}</p>
                    )}
                  </div>
                  <div className="activity-actions">
                    <button 
                      className="btn-icon"
                      onClick={() => handleEdit(activity)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="btn-icon danger"
                      onClick={() => handleDelete(activity._id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityList;