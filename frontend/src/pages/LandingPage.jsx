import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    const handleScrollToFeatures = () => {
        const element = document.getElementById('features');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="homepage">
            {/* 1. Hero Section */}
            <div className="hero-section landing-hero">
                <div className="landing-content">
                    <h1 className="landing-title">FinLy<br />Your Autonomous<br />Finance Agent</h1>
                    <p className="landing-subtitle">
                        Predict cashflow risk, make smart financial decisions, and act automatically.
                        FinLy runs your startup’s finances while you focus on building.
                    </p>

                    <div className="hero-actions center-actions">
                        <button className="primary-action large-btn" onClick={() => navigate('/homepage')}>
                            <span>Get Started</span>
                            {/* <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                                <path d="M10 4L16 10L10 16M16 10H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg> */}
                        </button>
                        <button className="secondary-action large-btn" onClick={handleScrollToFeatures}>
                            See How It Works
                        </button>
                    </div>
                </div>
            </div>

            <div className="main-container">
                {/* 2. How FinLy Works */}
                <div id="features" className="landing-section">
                    <div className="landing-hero">
                        <h2 className='landing-title-sm'>How FinLy Works</h2>

                    </div>

                    <div className="metrics-section">
                        <div className="metric-card">
                            <label>Step 1</label>
                            <div className="metric-value">Input</div>
                            <p className="card-desc">Sync cash, bills, salaries, and receivables and more.</p>
                        </div>

                        <div className="metric-card">
                            <label>Step 2</label>
                            <div className="metric-value positive">Analyze</div>
                            <p className="card-desc">AI simulates thousands of future scenarios.</p>
                        </div>

                        <div className="metric-card">
                            <label>Step 3</label>
                            <div className="metric-value negative">Decide</div>
                            <p className="card-desc">Optimal strategy chosen to minimize risk.</p>
                        </div>

                        <div className="metric-card">
                            <label>Step 4</label>
                            <div className="metric-value">Act</div>
                            <p className="card-desc">Emails sent and payments scheduled automatically.</p>
                        </div>
                    </div>
                </div>

                {/* 3. Why FinLy */}
                <div className="landing-section">
                    <div className="landing-hero">
                        <h2 className='landing-title-sm'>Why FinLy?</h2>
                    </div>

                    <div className="feature-grid">
                        <div className="glass-card feature-card">

                            <h3>Prevents Cashflow Crises</h3>
                            <p>Never get caught off guard. FinLy predicts risks weeks before they happen.</p>
                        </div>

                        <div className="glass-card feature-card">

                            <h3>Autonomous Agent</h3>
                            <p>Not just a dashboard. An active agent that works for you 24/7.</p>
                        </div>

                        <div className="glass-card feature-card">

                            <h3>Built for Startups</h3>
                            <p>For founders who want to focus on product, not spreadsheets.</p>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
};

export default LandingPage;
