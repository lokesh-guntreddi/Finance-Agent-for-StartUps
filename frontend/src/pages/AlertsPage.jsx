import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AlertsPage = () => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, critical, overdue, salary-risk

    useEffect(() => {
        const fetchAndGenerateAlerts = async () => {
            try {
                const [analysisRes, receivablesRes, salariesRes, billsRes] = await Promise.all([
                    fetch(`${API_URL}/api/analysis-results/latest`),
                    fetch(`${API_URL}/api/receivables`),
                    fetch(`${API_URL}/api/salaries`),
                    fetch(`${API_URL}/api/bills`)
                ]);

                const analysis = await analysisRes.json();
                const receivables = await receivablesRes.json();
                const salaries = await salariesRes.json();
                const bills = await billsRes.json();

                const generatedAlerts = [];

                // 1. Generate alerts from risk analysis
                if (analysis && analysis.risk_analysis) {
                    const riskScore = analysis.risk_analysis.risk_score || 0;

                    if (riskScore > 70) {
                        generatedAlerts.push({
                            id: 'risk-critical',
                            severity: 'critical',
                            title: 'Critical Cash Flow Risk',
                            thought: `Your company is at ${riskScore}/100 risk. ${analysis.risk_analysis.dominant_risk || 'Cash shortage detected'}.`,
                            timePressure: analysis.risk_analysis.critical_window || 'Immediate attention required',
                            plan: analysis.decision?.strategy ? `FinLy is executing: ${analysis.decision.strategy}` : 'FinLy is analyzing options',
                            category: 'financial'
                        });
                    } else if (riskScore > 40) {
                        generatedAlerts.push({
                            id: 'risk-warning',
                            severity: 'warning',
                            title: 'Financial Health Under Watch',
                            thought: `Risk score at ${riskScore}/100. ${analysis.risk_analysis.dominant_risk || 'Monitor cash position'}.`,
                            timePressure: analysis.risk_analysis.critical_window || 'Review in 48 hours',
                            plan: 'FinLy is monitoring actively',
                            category: 'financial'
                        });
                    }
                }

                // 2. Overdue receivables
                const overdue = receivables.filter(r => r.due_in_days < 0);
                if (overdue.length > 0) {
                    const totalOverdue = overdue.reduce((sum, r) => sum + r.amount, 0);
                    const worstClient = overdue.sort((a, b) => Math.abs(b.due_in_days) - Math.abs(a.due_in_days))[0];

                    generatedAlerts.push({
                        id: 'overdue-payments',
                        severity: 'critical',
                        title: `${overdue.length} Overdue Payment${overdue.length > 1 ? 's' : ''}`,
                        thought: `Client ${worstClient.client} is ${Math.abs(worstClient.due_in_days)} days late on ₹${worstClient.amount.toLocaleString()}. Total overdue: ₹${totalOverdue.toLocaleString()}.`,
                        timePressure: `Longest delay: ${Math.abs(worstClient.due_in_days)} days`,
                        plan: 'FinLy will escalate collection reminders',
                        category: 'overdue'
                    });
                }

                // 3. Urgent receivables (due very soon)
                const urgent = receivables.filter(r => r.due_in_days > 0 && r.due_in_days <= 3);
                if (urgent.length > 0) {
                    const totalUrgent = urgent.reduce((sum, r) => sum + r.amount, 0);

                    generatedAlerts.push({
                        id: 'urgent-payments',
                        severity: 'warning',
                        title: `${urgent.length} Payment${urgent.length > 1 ? 's' : ''} Due Soon`,
                        thought: `₹${totalUrgent.toLocaleString()} expected in next 3 days from ${urgent.map(u => u.client).join(', ')}.`,
                        timePressure: `Payments due within ${Math.min(...urgent.map(u => u.due_in_days))} days`,
                        plan: 'FinLy will send courtesy reminders',
                        category: 'receivable'
                    });
                }

                // 4. Salary pressure
                const upcomingSalaries = salaries.filter(s => s.due_in_days <= 7);
                if (upcomingSalaries.length > 0) {
                    const totalPayroll = upcomingSalaries.reduce((sum, s) => sum + s.amount, 0);
                    const daysUntil = Math.min(...upcomingSalaries.map(s => s.due_in_days));

                    generatedAlerts.push({
                        id: 'salary-due',
                        severity: daysUntil <= 3 ? 'critical' : 'warning',
                        title: 'Team Payroll Approaching',
                        thought: `₹${totalPayroll.toLocaleString()} in salaries due for ${upcomingSalaries.length} team member${upcomingSalaries.length > 1 ? 's' : ''}.`,
                        timePressure: `Payroll due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
                        plan: daysUntil <= 3 ? 'FinLy recommends securing funds immediately' : 'FinLy is monitoring cash reserves',
                        category: 'salary'
                    });
                }

                // 5. Bill pressure
                const upcomingBills = bills.filter(b => b.due_in_days <= 5);
                if (upcomingBills.length > 0) {
                    const totalBills = upcomingBills.reduce((sum, b) => sum + b.amount, 0);

                    generatedAlerts.push({
                        id: 'bills-due',
                        severity: 'info',
                        title: 'Vendor Payments Upcoming',
                        thought: `₹${totalBills.toLocaleString()} in bills due soon (${upcomingBills.map(b => b.type).join(', ')}).`,
                        timePressure: `Due within ${Math.min(...upcomingBills.map(b => b.due_in_days))} days`,
                        plan: 'FinLy will schedule payments',
                        category: 'vendor'
                    });
                }

                // 6. Failed actions (if any targets were not processed)
                if (analysis?.action_log?.action_taken === 'NO_ACTION' && analysis?.decision?.strategy !== 'NO_ACTION') {
                    generatedAlerts.push({
                        id: 'action-blocked',
                        severity: 'warning',
                        title: 'Action Execution Issue',
                        thought: 'FinLy recommended action but could not execute automatically.',
                        timePressure: 'Manual review needed',
                        plan: 'Review decision log and take manual action',
                        category: 'system'
                    });
                }

                // Sort by severity: critical > warning > info
                const severityOrder = { critical: 0, warning: 1, info: 2 };
                generatedAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

                setAlerts(generatedAlerts);
            } catch (error) {
                console.error('Failed to generate alerts', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAndGenerateAlerts();
    }, []);

    const filteredAlerts = alerts.filter(alert => {
        if (filter === 'critical') return alert.severity === 'critical';
        if (filter === 'overdue') return alert.category === 'overdue';
        if (filter === 'salary-risk') return alert.category === 'salary';
        return true;
    });

    const getSeverityStyle = (severity) => {
        switch (severity) {
            case 'critical':
                return {
                    color: '#fb7185',
                    bg: 'rgba(251, 113, 133, 0.1)',
                    border: '#fb7185',
                    glow: '0 0 20px rgba(251, 113, 133, 0.3)'
                };
            case 'warning':
                return {
                    color: '#fbbf24',
                    bg: 'rgba(251, 191, 36, 0.1)',
                    border: '#fbbf24',
                    glow: '0 0 16px rgba(251, 191, 36, 0.2)'
                };
            default:
                return {
                    color: '#38bdf8',
                    bg: 'rgba(56, 189, 248, 0.1)',
                    border: '#38bdf8',
                    glow: '0 0 12px rgba(56, 189, 248, 0.15)'
                };
        }
    };

    return (
        <div className="homepage">
            {/* Header */}
            <div className="hero-section" style={{ padding: '20px 0', marginBottom: '20px' }}>
                <div className="hero-content">
                    <div className="brand">
                        <span className="logo-icon">⚠</span>
                        <div className="brand-text">
                            <h1>Risk & Attention Center</h1>
                            <p>What FinLy is worried about right now.</p>
                        </div>
                    </div>
                    <div className="hero-actions">
                        <button className="secondary-action" onClick={() => navigate('/clients')}>
                            <span>Client Intelligence</span>
                        </button>
                        <button className="secondary-action" onClick={() => navigate('/dashboard')}>
                            <span>Live Dashboard</span>
                        </button>
                        <button className="primary-action" onClick={() => navigate('/')}>
                            <span>New Simulation</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="main-container">
                {/* Filters */}
                <div className="tabs" style={{ maxWidth: '700px', marginBottom: '32px' }}>
                    <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                        All Alerts ({alerts.length})
                    </button>
                    <button className={`tab ${filter === 'critical' ? 'active' : ''}`} onClick={() => setFilter('critical')}>
                        Critical Only
                    </button>
                    <button className={`tab ${filter === 'overdue' ? 'active' : ''}`} onClick={() => setFilter('overdue')}>
                        Overdue Clients
                    </button>
                    <button className={`tab ${filter === 'salary-risk' ? 'active' : ''}`} onClick={() => setFilter('salary-risk')}>
                        Salary Risk
                    </button>
                </div>

                {/* Alerts Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            Analyzing risks...
                        </div>
                    ) : filteredAlerts.length === 0 ? (
                        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>

                            <h2 style={{ fontSize: '20px', color: '#34d399', marginBottom: '8px' }}>No Critical Issues Detected</h2>
                            <p style={{ color: '#64748b', fontSize: '14px' }}>FinLy is monitoring your business. Everything looks stable.</p>
                        </div>
                    ) : (
                        filteredAlerts.map((alert) => {
                            const style = getSeverityStyle(alert.severity);

                            return (
                                <div
                                    key={alert.id}
                                    className="glass-card"
                                    style={{
                                        padding: '24px',
                                        borderLeft: `4px solid ${style.border}`,
                                        boxShadow: alert.severity === 'critical' ? style.glow : 'none',
                                        animation: alert.severity === 'critical' ? 'pulse 2s ease-in-out infinite' : 'none'
                                    }}
                                >
                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#e2e8f0', margin: '0 0 4px 0' }}>
                                                {alert.title}
                                            </h3>
                                        </div>
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                background: style.bg,
                                                color: style.color,
                                                border: `1px solid ${style.border}40`
                                            }}
                                        >
                                            {alert.severity}
                                        </span>
                                    </div>

                                    {/* FinLy's Thought */}
                                    <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>
                                            FinLy's Analysis
                                        </div>
                                        <p style={{ fontSize: '15px', color: '#e2e8f0', lineHeight: '1.6', margin: 0 }}>
                                            {alert.thought}
                                        </p>
                                    </div>

                                    {/* Time Pressure & Plan */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                                                Time Pressure
                                            </div>
                                            <div style={{ fontSize: '14px', color: style.color, fontWeight: '600' }}>
                                                ⏰ {alert.timePressure}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                                                FinLy's Plan
                                            </div>
                                            <div style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: '500' }}>
                                                {alert.plan}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                        <button
                                            className="secondary-action"
                                            style={{ padding: '8px 16px', fontSize: '13px' }}
                                            onClick={() => navigate('/dashboard')}
                                        >
                                            View Details
                                        </button>
                                        {alert.category === 'overdue' && (
                                            <button
                                                className="primary-action"
                                                style={{ padding: '8px 16px', fontSize: '13px' }}
                                                onClick={() => navigate('/clients')}
                                            >
                                                Review Clients
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.85;
                    }
                }
            `}</style>
        </div>
    );
};

export default AlertsPage;
