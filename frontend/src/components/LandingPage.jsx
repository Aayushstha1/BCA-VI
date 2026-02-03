import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="lp-hero">
      <div className="lp-card">
        <h1 className="lp-title">Welcome to CV Portal</h1>
        <p className="lp-sub">Create, upload and manage your CVs. Submit them for approval and download approved copies.</p>

        <div className="lp-actions">
          <button className="lp-btn lp-btn-primary" onClick={() => navigate('/login')}>Login</button>
          <button className="lp-btn" onClick={() => navigate('/register')}>Register</button>
        </div>

        <p className="lp-footer">
          Already logged in? <button className="lp-link" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
