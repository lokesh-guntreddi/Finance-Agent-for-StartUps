import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css'; // Using existing premium theme

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const HistoryPage = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, high-risk, action-taken
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${API_URL}/api/analysis-results`);
                if (res.ok) {
                    const data = await res.json();
                    // Sort by newest first
                    setHistory(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
                }
            } catch (error) {
                console.error("Failed to load history", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(val || 0);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return {
            day: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const getHealthBadge = (score) => {
        if (score > 70) return { label: 'At Risk', class: 'agent-status active', style: { color: '#fb7185', borderColor: '#fb7185', background: 'rgba(251, 113, 133, 0.1)' } };
        if (score > 40) return { label: 'Under Watch', class: 'agent-status', style: { color: '#fbbf24', borderColor: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)' } };
        return { label: 'Healthy', class: 'agent-status active', style: { color: '#34d399', borderColor: '#34d399', background: 'rgba(52, 211, 153, 0.1)' } };
    };

    const filteredHistory = history.filter(item => {
        if (filter === 'high-risk') return (item.risk_analysis?.risk_score || 0) > 40;
        if (filter === 'action-taken') return item.action_log?.action_taken !== 'NO_ACTION';
        return true;
    });

    return (
        <div className="homepage">
            {/* Header */}
            <div className="hero-section" style={{ padding: '20px 0', marginBottom: '20px' }}>
                <div className="hero-content">
                    <div className="brand">
                        <span className="logo-icon">M</span>
                        <div className="brand-text">
                            <h1>FinLy Memory Bank</h1>
                            <p>Full audit log of every decision FinLy has made for your company.</p>
                        </div>
                    </div>
                    <div className="hero-actions">
                        <button className="secondary-action" onClick={() => navigate('/clients')}>
                            <span>Client Intelligence</span>
                        </button>
                        <button className="secondary-action" onClick={() => navigate('/dashboard')}>
                            <span>View Live Dashboard</span>
                        </button>
                        <button className="primary-action" onClick={() => navigate('/')}>
                            <span>New Simulation</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="main-container">
                {/* Filters */}
                <div className="tabs" style={{ maxWidth: '600px', marginBottom: '32px' }}>
                    <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All History</button>
                    <button className={`tab ${filter === 'high-risk' ? 'active' : ''}`} onClick={() => setFilter('high-risk')}>High Risk Events</button>
                    <button className={`tab ${filter === 'action-taken' ? 'active' : ''}`} onClick={() => setFilter('action-taken')}>Actions Taken</button>
                </div>

                {/* Timeline Feed */}
                <div className="history-feed" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading memory...</div>
                    ) : filteredHistory.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No history found. Run your first simulation!</div>
                    ) : (
                        filteredHistory.map((item) => {
                            const date = formatDate(item.createdAt);
                            const health = getHealthBadge(item.risk_analysis?.risk_score);
                            const isExpanded = expandedId === item._id;

                            return (
                                <div key={item._id} className="glass-card" style={{ padding: '0', overflow: 'hidden', borderLeft: `4px solid ${health.style.color}` }}>

                                    {/* Summary Row (Always Visible) */}
                                    <div
                                        className="history-summary"
                                        onClick={() => toggleExpand(item._id)}
                                        style={{ padding: '24px', cursor: 'pointer', display: 'grid', gridTemplateColumns: '120px 1fr 1fr auto', alignItems: 'center', gap: '20px' }}
                                    >
                                        <div className="date-block">
                                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#e2e8f0' }}>{date.day}</div>
                                            <div style={{ fontSize: '13px', color: '#64748b' }}>{date.time}</div>
                                        </div>

                                        <div className="health-block">
                                            <span className={health.class} style={health.style}>{health.label}</span>
                                            <span style={{ marginLeft: '10px', fontSize: '13px', color: '#94a3b8' }}>Score: {item.risk_analysis?.risk_score}/100</span>
                                        </div>

                                        <div className="cash-block">
                                            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Projection</div>
                                            <div style={{
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                color: (item.financial_metrics?.net_position ?? item.risk_analysis?.sub_goal?.projected_balance ?? 0) >= 0 ? '#34d399' : '#fb7185'
                                            }}>
                                                {formatCurrency(
                                                    item.financial_metrics?.net_position ??
                                                    item.risk_analysis?.sub_goal?.projected_balance ??
                                                    (item.risk_analysis?.sub_goal?.intent === 'COVER_DEFICIT' ? -item.risk_analysis.sub_goal.required_amount : 0)
                                                )}
                                            </div>
                                        </div>

                                        <div className="expand-icon" style={{ color: '#64748b', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                                            ▼
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="history-details" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px', background: 'rgba(0,0,0,0.2)' }}>

                                            {/* Grid layout for thinking */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>

                                                {/* 1. Risk Insight */}
                                                <div className="detail-col">
                                                    <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}> FinLy's Diagnosis</h3>
                                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                                                        <p style={{ color: '#e2e8f0', fontSize: '15px', lineHeight: '1.5', marginBottom: '8px' }}>
                                                            identified <strong>{item.risk_analysis?.dominant_risk}</strong>.
                                                        </p>
                                                        <p style={{ color: '#64748b', fontSize: '14px' }}>
                                                            Goal: {item.risk_analysis?.sub_goal?.intent}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* 2. Decision */}
                                                <div className="detail-col">
                                                    <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}> Strategic Decision</h3>
                                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <span style={{ color: '#a78bfa', fontWeight: '600', fontSize: '15px' }}>{item.decision?.strategy}</span>
                                                            <span style={{ color: '#34d399', fontWeight: '600' }}>{formatCurrency(item.decision?.amount_goal)}</span>
                                                        </div>
                                                        <p style={{ color: '#cbd5e1', fontSize: '14px', fontStyle: 'italic', lineHeight: '1.5' }}>
                                                            "{item.decision?.rationale}"
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* 3. Action Log */}
                                                <div className="detail-col">
                                                    <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}> Execution</h3>
                                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                                                        <p style={{ color: '#e2e8f0', fontSize: '15px', marginBottom: '8px' }}>
                                                            {item.action_log?.action_taken === 'NO_ACTION' ? 'No external action needed.' : item.action_log?.action_taken}
                                                        </p>

                                                        {item.action_log?.targets_processed?.length > 0 && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                                                {item.action_log.targets_processed.map((t, idx) => (
                                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                                                        <span style={{ color: '#34d399' }}>✔ Sent</span>
                                                                        <span style={{ color: '#e2e8f0' }}>{t.target}</span>
                                                                        <span style={{ color: '#64748b' }}>({t.email})</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* LLM Transparency Footer */}
                                            {item.decision?.scenarios && (
                                                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                                    <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', marginBottom: '12px' }}>Simulated Scenarios</h4>
                                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                        {item.decision.scenarios.map((s, idx) => (
                                                            <span key={idx} style={{ fontSize: '13px', padding: '4px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', color: '#94a3b8' }}>
                                                                {s.name}: {formatCurrency(s.projected_balance)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;
