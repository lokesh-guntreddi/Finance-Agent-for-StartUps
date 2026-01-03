import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css'; // Using existing premium theme
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ClientsPage = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, high-risk, overdue

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch receivables to get raw client data
                const receivablesRes = await fetch(`${API_URL}/api/receivables`);
                const receivables = await receivablesRes.json();

                // Fetch history to get action logs and past decisions
                const historyRes = await fetch(`${API_URL}/api/analysis-results`);
                const history = await historyRes.json();

                // Aggregate data by client
                const clientMap = new Map();

                receivables.forEach(r => {
                    if (!clientMap.has(r.client)) {
                        clientMap.set(r.client, {
                            id: r._id,
                            name: r.client,
                            email: r.email,
                            totalOwed: 0,
                            items: [],
                            overdueAmount: 0,
                            history: []
                        });
                    }
                    const c = clientMap.get(r.client);
                    c.totalOwed += r.amount;
                    c.items.push(r);
                    if (r.due_in_days < 0) {
                        c.overdueAmount += r.amount;
                    }
                });

                // Attach history to clients
                history.forEach(h => {
                    const targets = h.action_log?.targets_processed || [];
                    targets.forEach(t => {
                        // Fuzzy match or exact match if possible. 
                        // For now we assume names match or email matches.
                        const client = clientMap.get(t.target);
                        if (client) {
                            client.history.push({
                                date: h.createdAt,
                                action: h.action_log.action_taken,
                                status: 'Sent' // Assuming sent if it's in the log
                            });
                        }
                    });
                });

                // Calculate Risk Scores & Derive Intelligence
                const processedClients = Array.from(clientMap.values()).map(c => {
                    const avgDueDays = c.items.reduce((acc, i) => acc + i.due_in_days, 0) / c.items.length;

                    let riskScore = 0;
                    let riskLabel = 'Reliable';
                    let riskColor = '#34d399'; // green

                    if (c.overdueAmount > 0) {
                        riskScore = 80;
                        riskLabel = 'High Risk';
                        riskColor = '#fb7185'; // red
                    } else if (avgDueDays < 5) {
                        riskScore = 50;
                        riskLabel = 'Delays Sometimes';
                        riskColor = '#fbbf24'; // yellow
                    }

                    // Opinion Logic
                    let opinion = `Pays on time mostly. Average due in ${Math.round(avgDueDays)} days.`;
                    if (riskScore > 70) opinion = `FinLy considers this client risky because they have overdue payments of ₹${c.overdueAmount.toLocaleString()}.`;
                    else if (riskScore > 40) opinion = `Monitor closely. Payments are due very soon (avg ${Math.round(avgDueDays)} days).`;

                    // Next Move Logicnio
                    let nextMove = "No immediate action needed.";
                    if (riskScore > 70) nextMove = "FinLy plans to send a strong reminder immediately.";
                    else if (avgDueDays < 3) nextMove = "FinLy will send a courtesy reminder in 24 hours.";

                    return {
                        ...c,
                        riskScore,
                        riskLabel,
                        riskColor,
                        opinion,
                        nextMove,
                        avgDueDays
                    };
                });

                setClients(processedClients.sort((a, b) => b.riskScore - a.riskScore));

            } catch (error) {
                console.error("Failed to load client data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredClients = clients.filter(c => {
        if (filter === 'high-risk') return c.riskScore >= 50;
        if (filter === 'overdue') return c.overdueAmount > 0;
        return true;
    });

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(val || 0);

    return (
        <div className="homepage">
            {/* Header */}
            <div className="hero-section" style={{ padding: '20px 0', marginBottom: '20px' }}>
                <div className="hero-content">
                    <div className="brand">
                        <span className="logo-icon">C</span>
                        <div className="brand-text">
                            <h1>Client Intelligence</h1>
                            <p>Know exactly who is hurting or helping your cashflow.</p>
                        </div>
                    </div>
                    <div className="hero-actions">
                        <button className="secondary-action" onClick={() => navigate('/history')}>
                            <span>Memory Log</span>
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
                    <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Clients</button>
                    <button className={`tab ${filter === 'high-risk' ? 'active' : ''}`} onClick={() => setFilter('high-risk')}>High Risk</button>
                    <button className={`tab ${filter === 'overdue' ? 'active' : ''}`} onClick={() => setFilter('overdue')}>Overdue Only</button>
                </div>

                {/* Clients Grid */}
                <div className="clients-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                    {loading ? (
                        <div style={{ color: '#94a3b8' }}>Loading intelligence...</div>
                    ) : filteredClients.length === 0 ? (
                        <div style={{ color: '#94a3b8' }}>No clients found matching criteria.</div>
                    ) : (
                        filteredClients.map(client => (
                            <div key={client.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', borderTop: `4px solid ${client.riskColor}` }}>

                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#e2e8f0', margin: '0 0 4px 0' }}>{client.name}</h3>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>{client.email}</div>
                                    </div>
                                    <span style={{
                                        fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                                        padding: '4px 8px', borderRadius: '6px',
                                        background: `${client.riskColor}20`, color: client.riskColor, border: `1px solid ${client.riskColor}40`
                                    }}>
                                        {client.riskLabel}
                                    </span>
                                </div>

                                {/* Financials */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>Total Owed</div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#e2e8f0' }}>{formatCurrency(client.totalOwed)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>Overdue</div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: client.overdueAmount > 0 ? '#fb7185' : '#34d399' }}>
                                            {formatCurrency(client.overdueAmount)}
                                        </div>
                                    </div>
                                </div>

                                {/* FinLy's Brain */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#a78bfa', marginBottom: '6px', textTransform: 'uppercase' }}> FinLy's Opinion</div>
                                        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                                            {client.opinion}
                                        </p>
                                    </div>

                                    <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8', marginBottom: '6px', textTransform: 'uppercase' }}> Next Move</div>
                                        <p style={{ fontSize: '13px', color: '#e0f2fe', lineHeight: '1.5', margin: 0 }}>
                                            {client.nextMove}
                                        </p>
                                    </div>
                                </div>

                                {/* Action History Snippet */}
                                {client.history.length > 0 && (
                                    <div style={{ marginTop: 'auto' }}>
                                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>Recent Interaction</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }}></span>
                                            {new Date(client.history[0].date).toLocaleDateString()} — {client.history[0].action}
                                        </div>
                                    </div>
                                )}

                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientsPage;
