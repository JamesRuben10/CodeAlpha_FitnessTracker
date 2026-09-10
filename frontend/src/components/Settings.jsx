import React, { useEffect, useState } from 'react';
import { FaBullseye, FaCog, FaMoon, FaSun, FaUser } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Settings = () => {
  const { user, updateGoals, error, setError } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [goals, setGoals] = useState({
    calories: user?.dailyGoal?.calories || 2000,
    steps: user?.dailyGoal?.steps || 10000,
    workoutMinutes: user?.dailyGoal?.workoutMinutes || 30
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setError(null);
  }, [setError]);

  const handleChange = event => {
    setGoals(previous => ({ ...previous, [event.target.name]: event.target.value }));
    setNotice('');
    setError(null);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);
    const result = await updateGoals({
      calories: Number(goals.calories),
      steps: Number(goals.steps),
      workoutMinutes: Number(goals.workoutMinutes)
    });
    setSaving(false);
    if (result.success) setNotice('Your daily goals have been saved.');
  };

  return (
    <main className="settings-page">
      <header className="settings-header">
        <div>
          <span className="settings-kicker">PERSONAL SETTINGS</span>
          <h1>Shape your targets.</h1>
          <p>Keep your goals realistic, visible, and yours.</p>
        </div>
        <FaCog className="settings-header-icon" aria-hidden="true" />
      </header>

      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card-heading">
            <FaBullseye />
            <div>
              <span className="settings-card-kicker">DAILY TARGETS</span>
              <h2>Goal progress targets</h2>
            </div>
          </div>
          <p className="settings-description">These targets power the progress bars on your dashboard.</p>
          {error && <div className="alert alert-error">{error}</div>}
          {notice && <div className="alert alert-success">{notice}</div>}
          <form onSubmit={handleSubmit}>
            <div className="settings-form-grid">
              <div className="form-group">
                <label htmlFor="calories">Calories</label>
                <input id="calories" name="calories" type="number" min="1" value={goals.calories} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="steps">Steps</label>
                <input id="steps" name="steps" type="number" min="1" value={goals.steps} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="workoutMinutes">Active minutes</label>
                <input id="workoutMinutes" name="workoutMinutes" type="number" min="1" value={goals.workoutMinutes} onChange={handleChange} required />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save goals'}
            </button>
          </form>
        </section>

        <section className="settings-card settings-account-card">
          <div className="settings-card-heading">
            <FaUser />
            <div>
              <span className="settings-card-kicker">ACCOUNT</span>
              <h2>{user?.name}</h2>
            </div>
          </div>
          <p className="settings-description">Signed in as {user?.email}</p>
          <div className="settings-account-detail">
            <span>Badges earned</span>
            <strong>{user?.achievements?.length || 0}</strong>
          </div>
          <div className="settings-account-detail">
            <span>Current streak</span>
            <strong>{user?.streak?.current || 0} days</strong>
          </div>
          <button type="button" className="theme-setting" onClick={toggleTheme}>
            {theme === 'light' ? <FaMoon /> : <FaSun />}
            <span>Use {theme === 'light' ? 'dark' : 'light'} theme</span>
          </button>
        </section>
      </div>
    </main>
  );
};

export default Settings;