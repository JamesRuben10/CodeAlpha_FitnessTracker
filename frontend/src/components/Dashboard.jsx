import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { FaRunning, FaFire, FaShoePrints, FaClock, FaArrowUp, FaBullseye, FaShareAlt } from 'react-icons/fa';
import API_URL from '../config/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const shareCardRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_URL}/activities/week`)
      .then(response => {
        setWeeklyData(response.data);
        updateUser({ achievements: response.data.achievements, streak: response.data.streak });
      })
      .catch(fetchError => {
        console.error('Error fetching data:', fetchError);
        setError('Failed to load data');
      })
      .finally(() => setLoading(false));
  }, [updateUser]);

  const percentage = (current, previous) => previous ? Math.round(((current - previous) / previous) * 100) : current ? 100 : 0;

  const shareProgress = async () => {
    if (!shareCardRef.current) return;
    const canvas = await html2canvas(shareCardRef.current, { backgroundColor: '#17343a', scale: 2 });
    const link = document.createElement('a');
    link.download = 'fitness-progress.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    setNotice('Progress card downloaded.');
  };

  const copyProgress = async () => {
    const text = `${user?.name}'s week: ${summary.totalCalories || 0} calories, ${summary.totalSteps || 0} steps, ${summary.totalWorkouts || 0} workouts, ${summary.totalDuration || 0} active minutes.`;
    const shareUrl = `${window.location.origin}/?progress=${btoa(unescape(encodeURIComponent(text)))}`;
    await navigator.clipboard.writeText(`${text} ${shareUrl}`);
    setNotice('Progress summary and share link copied to clipboard.');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your fitness data...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const { summary, chartData, previousSummary = {}, achievements = [], streak = { current: 0, best: 0 }, challenge } = weeklyData || { summary: { totalCalories: 0, totalWorkouts: 0, totalSteps: 0, totalDuration: 0 } };

  // Chart configuration
  const barChartData = {
    labels: chartData?.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })) || [],
    datasets: [
      {
        label: 'Calories Burned',
        data: chartData?.map(d => d.calories) || [],
        backgroundColor: 'rgba(141, 216, 200, 0.8)',
        borderColor: '#8dd8c8',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#71858a' } },
      y: { grid: { color: 'rgba(113, 133, 138, 0.15)' }, ticks: { color: '#71858a' } }
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <span className="dashboard-kicker">PERFORMANCE OVERVIEW</span>
          <h1>Welcome back, {user?.name}.</h1>
          <p>Your consistency is the real personal record.</p>
        </div>
        <div className="dashboard-actions"><button className="dashboard-action" onClick={shareProgress}><FaShareAlt /> Share progress</button><Link to="/add-activity" className="dashboard-action"><FaRunning /> Log a workout</Link></div>
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="stats-grid">
        <div className="stat-card stat-card-calories">
          <div className="stat-icon" style={{ background: '#FF6B6B' }}>
            <FaFire />
          </div>
          <div className="stat-info">
            <h3>{summary.totalCalories}</h3>
            <p>Total Calories Burned</p>
            <span className="stat-trend"><FaArrowUp /> This week</span>
          </div>
        </div>

        <div className="stat-card stat-card-workouts">
          <div className="stat-icon" style={{ background: '#4ECDC4' }}>
            <FaRunning />
          </div>
          <div className="stat-info">
            <h3>{summary.totalWorkouts}</h3>
            <p>Total Workouts</p>
            <span className="stat-trend"><FaArrowUp /> Training volume</span>
          </div>
        </div>

        <div className="stat-card stat-card-steps">
          <div className="stat-icon" style={{ background: '#45B7D1' }}>
            <FaShoePrints />
          </div>
          <div className="stat-info">
            <h3>{summary.totalSteps}</h3>
            <p>Total Steps</p>
            <span className="stat-trend">Daily movement</span>
          </div>
        </div>

        <div className="stat-card stat-card-duration">
          <div className="stat-icon" style={{ background: '#F9CA24' }}>
            <FaClock />
          </div>
          <div className="stat-info">
            <h3>{summary.totalDuration}m</h3>
            <p>Total Minutes Active</p>
            <span className="stat-trend">Time invested</span>
          </div>
        </div>
      </div>

      <div className="insight-grid">
        <section className="insight-panel streak-panel"><span className="section-kicker">CONSISTENCY</span><h2>🔥 {streak.current}-Day Streak!</h2><p>{streak.current ? 'Keep the rhythm going today.' : 'Log an activity today to start your streak.'}</p><strong>Best streak: {streak.best} days</strong></section>
        <section className="insight-panel challenge-panel"><div className="section-heading"><div><span className="section-kicker">THIS WEEK</span><h2>{challenge?.title || 'Weekly challenge'}</h2></div><span className="challenge-percent">{Math.min(Math.round(((challenge?.progress || 0) / (challenge?.target || 1)) * 100), 100)}%</span></div><div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(((challenge?.progress || 0) / (challenge?.target || 1)) * 100, 100)}%` }} /></div><p>{challenge?.completed ? '🎉 Challenge Completed!' : `${challenge?.progress || 0} / ${challenge?.target || 0} complete`}</p></section>
      </div>

      <div className="chart-container">
        <div className="section-heading">
          <div>
            <span className="section-kicker">SEVEN DAY RHYTHM</span>
            <h2>Calories burned</h2>
          </div>
          <span className="chart-unit">KCAL / DAY</span>
        </div>
        <div className="chart-card">
          <Bar data={barChartData} options={barOptions} />
        </div>
      </div>

      <section className="dashboard-section"><div className="section-heading"><div><span className="section-kicker">MILESTONES</span><h2>Achievement badges</h2></div><strong>{achievements.length} earned</strong></div><div className="badge-grid">{achievements.length ? achievements.map(badge => <div className="achievement-badge" key={badge.key}><span>{badge.icon}</span><div><strong>{badge.title}</strong><small>{badge.description}</small></div></div>) : <p>Log your first activity to earn a badge.</p>}</div></section>

      <section className="dashboard-section"><div className="section-heading"><div><span className="section-kicker">WEEK OVER WEEK</span><h2>Compare with last week</h2></div></div><div className="comparison-grid">{[['totalCalories', 'Calories', '🔥'], ['totalSteps', 'Steps', '👟'], ['totalWorkouts', 'Workouts', '💪'], ['totalDuration', 'Active Minutes', '⏱️']].map(([key, label, icon]) => { const change = percentage(summary[key] || 0, previousSummary[key] || 0); return <div className="comparison-item" key={key}><span>{icon} {label}</span><strong className={change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'}>{change > 0 ? '+' : ''}{change}% {change > 0 ? '🔼' : change < 0 ? '🔽' : '⚪'}</strong><small>{summary[key] || 0} this week / {previousSummary[key] || 0} last week</small></div>; })}</div><div className="comparison-chart"><Bar data={{ labels: ['Calories', 'Steps', 'Workouts', 'Minutes'], datasets: [{ label: 'This week', data: [summary.totalCalories || 0, summary.totalSteps || 0, summary.totalWorkouts || 0, summary.totalDuration || 0], backgroundColor: '#197d73' }, { label: 'Last week', data: [previousSummary.totalCalories || 0, previousSummary.totalSteps || 0, previousSummary.totalWorkouts || 0, previousSummary.totalDuration || 0], backgroundColor: '#b5c9c5' }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div></section>

      <div className="share-card" ref={shareCardRef}><span className="section-kicker">FITNESS TRACKER</span><h2>{user?.name}'s weekly progress</h2><p>{summary.totalCalories || 0} calories · {summary.totalSteps || 0} steps · {summary.totalWorkouts || 0} workouts · {summary.totalDuration || 0} active minutes</p><strong>🔥 {streak.current}-day streak</strong><div className="share-card-badges">{achievements.slice(0, 5).map(badge => <span key={badge.key}>{badge.icon}</span>)}</div><em>Small steps. Stronger weeks.</em></div><button className="btn-secondary copy-progress" onClick={copyProgress}>Copy summary</button>

      {/* Goal Progress */}
      <div className="goals-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">YOUR TARGETS</span>
            <h2>Daily goal progress</h2>
          </div>
          <FaBullseye className="goal-mark" />
        </div>
        <div className="goal-progress">
          <div className="goal-item">
            <label>Calories: {summary.totalCalories || 0} / {user?.dailyGoal?.calories || 2000}</label>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${Math.min((summary.totalCalories / (user?.dailyGoal?.calories || 2000)) * 100, 100)}%`,
                  background: '#FF6B6B'
                }}
              ></div>
            </div>
          </div>
          
          <div className="goal-item">
            <label>Steps: {summary.totalSteps || 0} / {user?.dailyGoal?.steps || 10000}</label>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${Math.min((summary.totalSteps / (user?.dailyGoal?.steps || 10000)) * 100, 100)}%`,
                  background: '#4ECDC4'
                }}
              ></div>
            </div>
          </div>
          
          <div className="goal-item">
            <label>Active Minutes: {summary.totalDuration || 0} / {user?.dailyGoal?.workoutMinutes || 30}</label>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${Math.min((summary.totalDuration / (user?.dailyGoal?.workoutMinutes || 30)) * 100, 100)}%`,
                  background: '#45B7D1'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;