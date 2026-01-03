import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
}).format(val);

const DashboardPage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        const fetchLatestAnalysis = async () => {
            try {
                const response = await fetch(`${API_URL}/api/analysis-results/latest`);

                if (!response.ok) {
                    throw new Error('Failed to fetch analysis');
                }

                const result = await response.json();

                if (result && result._id) {
                    console.log("Loading Dashboard Data from MongoDB:", result);
                    setData(result);
                } else {
                    const stored = localStorage.getItem('last_analysis');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        console.log("Loading Dashboard Data from localStorage:", parsed);
                        setData(parsed);
                    } else {
                        setError("No analysis data found. Please run analysis first.");
                    }
                }
            } catch (err) {
                console.error("Error fetching analysis:", err);

                const stored = localStorage.getItem('last_analysis');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    console.log("Loading Dashboard Data from localStorage (fallback):", parsed);
                    setData(parsed);
                } else {
                    setError("Unable to load analysis data. Please try running analysis again.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchLatestAnalysis();
    }, [navigate]);

    if (loading) return (
        <div className="dashboard-page">
            <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading analysis...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="dashboard-page">
            <div className="error-state">
                <div className="error-icon">⚠️</div>
                <h2>{error}</h2>
                <button className="primary-button" onClick={() => navigate('/')}>
                    Return to Input
                </button>
            </div>
        </div>
    );

    if (!data) return null;

    const { risk_analysis, decision, action_log } = data;

    // 1. Risk Agent Logic
    const riskScore = risk_analysis?.risk_score || 0;

    let healthStatus = 'Healthy';
    let riskColor = '#34D399'; // Green
    let riskBadgeVariant = 'success';

    if (riskScore > 70) {
        healthStatus = 'At Risk';
        riskColor = '#FB7185'; // Red
        riskBadgeVariant = 'critical';
    } else if (riskScore > 40) {
        healthStatus = 'Under Watch';
        riskColor = '#FBBF24'; // Yellow
        // Use a custom badge style or fallback to 'standby'/'warning' if available, otherwise just use color
        riskBadgeVariant = 'standby';
    }

    // 2. Decision Logic
    const strategyMap = {
        'COLLECT_RECEIVABLE': 'Collect pending payments',
        'DELAY_VENDOR_PAYMENT': 'Negotiate payment extensions',
        'DELAY_PAYMENTS': 'Delay non-critical payments',
        'AGGRESSIVE_COLLECTION': 'Urgent collection required',
        'ALERT_FOUNDER': 'Manual intervention required',
        'MAINTAIN_STATUS_QUO': 'Monitor situation'
    };
    const humanStrategy = strategyMap[decision?.strategy] || decision?.strategy || 'Analyzing...';

    // 3. Action Logic
    const actionMap = {
        'EMAIL_PAYMENT_REMINDER_MULTI': 'FinLy contacted clients',
        'FOUNDER_ALERTED': 'FinLy alerted founder',
        'PAYMENT_EXTENSION_REQUEST': 'FinLy requested extensions',
        'NO_ACTION': 'No action needed',
        'SCHEDULE_PAYMENT': 'Payments Scheduled'
    };
    const humanAction = actionMap[action_log?.action_taken] || action_log?.action_taken || 'Processing...';

    // Calculate recipients count correctly
    let recipientsCount = 0;
    if (action_log?.targets_processed) {
        recipientsCount = action_log.targets_processed.length;
    } else if (action_log?.target && action_log.target !== "None") {
        recipientsCount = 1;
    } else if (action_log?.action_taken === "FOUNDER_ALERTED") {
        recipientsCount = 1;
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-container">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <button onClick={() => navigate('/homepage')} className="back-button">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Back</span>
                        </button>
                    </div>

                    <div className="header-center">
                        <h1 className="dashboard-title">Agent Dashboard</h1>
                        {data.createdAt && (
                            <p className="dashboard-subtitle">
                                Analysis from {new Date(data.createdAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        )}
                    </div>

                    <div className="header-right" style={{ gap: '8px' }}>
                        {/* Alerts Button - Red */}
                        <button
                            className="nav-icon-btn"
                            onClick={() => navigate('/alerts')}
                            title="Risk Alerts"
                            style={{
                                background: 'rgba(251, 113, 133, 0.1)',
                                borderColor: 'rgba(251, 113, 133, 0.25)',
                                color: '#fb7185'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        {/* Intelligence Button */}
                        <button
                            className="nav-icon-btn"
                            onClick={() => navigate('/clients')}
                            title="Client Intelligence"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        {/* History Button */}
                        <button
                            className="nav-icon-btn"
                            onClick={() => navigate('/history')}
                            title="Memory Log"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>

                        {/* Refresh Button */}
                        <button
                            className="nav-icon-btn"
                            onClick={() => window.location.reload()}
                            title="Refresh Data"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        {/* Settings Button - Purple */}
                        <button
                            className="nav-icon-btn"
                            onClick={() => navigate('/settings')}
                            title="Settings"
                            style={{
                                background: 'rgba(167, 139, 250, 0.1)',
                                borderColor: 'rgba(167, 139, 250, 0.25)',
                                color: '#a78bfa'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Agent Cards Grid */}
                <div className="agents-grid">
                    {/* Risk Agent */}
                    <div className="agent-card risk-agent" style={{ '--accent-color': riskColor }}>
                        <div className="agent-card-header">
                            <div className="agent-title">
                                <h2>Financial Health</h2>
                            </div>
                            <span className={`status-badge ${riskBadgeVariant}`}>{healthStatus}</span>
                        </div>

                        <div className="agent-card-body">
                            <p style={{ marginBottom: '20px', fontSize: '15px', color: 'var(--text-muted)' }}>
                                Your company is financially <span style={{ color: riskColor, fontWeight: 700 }}>{healthStatus}</span>
                            </p>

                            <div className="metric-primary">
                                <label>Health Score</label>
                                <div className="risk-score-display">
                                    <span className="score-value">{riskScore}</span>
                                    <span className="score-max">/100</span>
                                </div>
                            </div>

                            <div className="risk-progress">
                                <div className="risk-progress-track">
                                    <div
                                        className="risk-progress-fill"
                                        style={{ width: `${riskScore}%`, backgroundColor: riskColor }}
                                    ></div>
                                </div>
                                <span className="risk-window">{risk_analysis?.critical_window || 'N/A'}</span>
                            </div>

                            <div className="metric-group">
                                <div className="metric-item">
                                    <label>Main Concern</label>
                                    <p className="metric-highlight">{risk_analysis?.dominant_risk || 'None'}</p>
                                </div>

                                <div className="metric-item">
                                    <label>FinLy’s Priority</label>
                                    <p className="metric-value">
                                        {risk_analysis?.sub_goal?.intent || 'No immediate priorities'}
                                        {risk_analysis?.sub_goal?.deadline_days > 0 && (
                                            <span className="metric-suffix"> · {risk_analysis.sub_goal.deadline_days}d</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decision Agent */}
                    <div className="agent-card decision-agent">
                        <div className="agent-card-header">
                            <div className="agent-title">
                                <h2>FinLy’s Plan</h2>
                            </div>
                        </div>

                        <div className="agent-card-body">
                            <div className="metric-primary">
                                <label>FinLy’s Plan</label>
                                <p className="strategy-text">{humanStrategy}</p>
                            </div>

                            <p className="metric-currency" style={{ fontSize: '18px', margin: '16px 0', color: 'var(--text-main)', fontWeight: 500 }}>
                                Collect <span style={{ color: '#34D399' }}>{formatCurrency(decision?.amount_goal || 0)}</span> from clients
                            </p>

                            <div className="metric-group">
                                <div className="metric-item">
                                    <label>Why this plan?</label>
                                    <p className="metric-description">
                                        {decision?.rationale || 'No reasoning provided.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Agent */}
                    <div className="agent-card action-agent">
                        <div className="agent-card-header">
                            <div className="agent-title">
                                <h2>Execution Log</h2>
                            </div>
                            <span className="status-badge executed">Executed</span>
                        </div>

                        <div className="agent-card-body">
                            <div className="metric-primary">
                                <label>Action Timeline</label>
                                <p className="action-text">{humanAction}</p>
                            </div>

                            {recipientsCount > 0 && (
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                    {recipientsCount} payment requests sent. FinLy is now waiting for replies.
                                </p>
                            )}

                            <div className="metric-group">
                                <div className="metric-item">
                                    <label>Recipients</label>
                                    <div className="recipients-list">
                                        {action_log?.targets_processed && action_log.targets_processed.length > 0 ? (
                                            action_log.targets_processed.map((t, i) => (
                                                <div key={i} className="recipient-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                                    <div>
                                                        <div className="recipient-name" style={{ fontWeight: 500, fontSize: '13px' }}>{t.target}</div>
                                                        <div className="recipient-email" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.email}</div>
                                                    </div>
                                                    <div className="recipient-status" style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(52, 211, 153, 0.2)', color: '#34D399', borderRadius: '4px' }}>
                                                        SENT
                                                    </div>
                                                </div>
                                            ))
                                        ) : action_log?.action_taken !== "NO_ACTION" ? (
                                            <div className="recipient-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                                <div>
                                                    <div className="recipient-name" style={{ fontWeight: 500, fontSize: '13px' }}>
                                                        {action_log.action_taken === "FOUNDER_ALERTED" ? "Founder/Admin" : (action_log.target || 'System')}
                                                    </div>
                                                    <div className="recipient-email" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{action_log.recipient_email || ''}</div>
                                                </div>
                                                <div className="recipient-status" style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(52, 211, 153, 0.2)', color: '#34D399', borderRadius: '4px' }}>
                                                    SENT
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="no-recipients">No specific recipients</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
