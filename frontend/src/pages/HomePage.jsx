import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const HomePage = () => {
    const navigate = useNavigate();

    const [financeData, setFinanceData] = useState({
        cash_balance: 0,
        preferences: { dont_delay_salaries: true }
    });

    const [salaries, setSalaries] = useState([]);
    const [bills, setBills] = useState([]);
    const [receivables, setReceivables] = useState([]);
    const [activeTab, setActiveTab] = useState('salaries');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Inputs
    const [salary, setSalary] = useState({ employee: '', amount: '', due_in_days: 15 });
    const [bill, setBill] = useState({ type: '', amount: '', due_in_days: 10 });
    const [receivable, setReceivable] = useState({ client: '', email: '', amount: '', due_in_days: 7 });

    const [stats, setStats] = useState({
        totalInflow: 0,
        totalOutflow: 0,
        netPosition: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        updateStats();
    }, [salaries, bills, receivables, financeData.cash_balance]);

    const loadData = async () => {
        try {
            const [salariesRes, billsRes, receivablesRes] = await Promise.all([
                fetch(`${API_URL}/api/salaries`),
                fetch(`${API_URL}/api/bills`),
                fetch(`${API_URL}/api/receivables`)
            ]);

            const salariesData = await salariesRes.json();
            const billsData = await billsRes.json();
            const receivablesData = await receivablesRes.json();

            setSalaries(salariesData);
            setBills(billsData);
            setReceivables(receivablesData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const updateStats = () => {
        const totalInflow = receivables.reduce((sum, r) => sum + (r.amount || 0), 0);
        const totalOutflow =
            salaries.reduce((sum, s) => sum + (s.amount || 0), 0) +
            bills.reduce((sum, b) => sum + (b.amount || 0), 0);
        const netPosition = financeData.cash_balance + totalInflow - totalOutflow;

        setStats({ totalInflow, totalOutflow, netPosition });
    };

    const addSalary = async () => {
        if (!salary.employee || !salary.amount) return;

        try {
            const res = await fetch(`${API_URL}/api/salaries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee: salary.employee,
                    amount: parseInt(salary.amount),
                    due_in_days: parseInt(salary.due_in_days) || 15
                })
            });

            if (res.ok) {
                const newSalary = await res.json();
                setSalaries([newSalary, ...salaries]);
                setSalary({ employee: '', amount: '', due_in_days: 15 });
            }
        } catch (error) {
            console.error('Error adding salary:', error);
        }
    };

    const addBill = async () => {
        if (!bill.type || !bill.amount) return;

        try {
            const res = await fetch(`${API_URL}/api/bills`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: bill.type,
                    amount: parseInt(bill.amount),
                    due_in_days: parseInt(bill.due_in_days) || 10
                })
            });

            if (res.ok) {
                const newBill = await res.json();
                setBills([newBill, ...bills]);
                setBill({ type: '', amount: '', due_in_days: 10 });
            }
        } catch (error) {
            console.error('Error adding bill:', error);
        }
    };

    const addReceivable = async () => {
        if (!receivable.client || !receivable.amount || !receivable.email) return;

        try {
            const res = await fetch(`${API_URL}/api/receivables`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client: receivable.client,
                    email: receivable.email,
                    amount: parseInt(receivable.amount),
                    due_in_days: parseInt(receivable.due_in_days) || 7
                })
            });

            if (res.ok) {
                const newReceivable = await res.json();
                setReceivables([newReceivable, ...receivables]);
                setReceivable({ client: '', email: '', amount: '', due_in_days: 7 });
            }
        } catch (error) {
            console.error('Error adding receivable:', error);
        }
    };

    const deleteSalary = async (id) => {
        try {
            const res = await fetch(`${API_URL}/api/salaries/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSalaries(salaries.filter(s => s._id !== id));
            }
        } catch (error) {
            console.error('Error deleting salary:', error);
        }
    };

    const deleteBill = async (id) => {
        try {
            const res = await fetch(`${API_URL}/api/bills/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setBills(bills.filter(b => b._id !== id));
            }
        } catch (error) {
            console.error('Error deleting bill:', error);
        }
    };

    const deleteReceivable = async (id) => {
        try {
            const res = await fetch(`${API_URL}/api/receivables/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setReceivables(receivables.filter(r => r._id !== id));
            }
        } catch (error) {
            console.error('Error deleting receivable:', error);
        }
    };

    const runAnalysis = async () => {
        const hasData = receivables.length > 0 || salaries.length > 0 || bills.length > 0;
        if (!hasData && !window.confirm("⚠️ No financial data entered. Continue?")) return;

        console.log("🚀 Triggering Analysis with cash_balance:", financeData.cash_balance);

        setIsAnalyzing(true);
        try {
            const res = await fetch(`${API_URL}/run-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cash_balance: financeData.cash_balance,
                    preferences: financeData.preferences
                })
            });

            if (!res.ok) throw new Error("API Error");
            const data = await res.json();

            localStorage.setItem('last_analysis', JSON.stringify(data));
            navigate('/dashboard');
        } catch (e) {
            alert("Connection Error: Is the backend running?");
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const checkDashboard = () => {
        const stored = localStorage.getItem('last_analysis');
        if (stored) {
            navigate('/dashboard');
        } else {
            alert('📊 No analysis results yet. Run a projection first!');
        }
    };

    const allItems = [
        ...salaries.map(s => ({ ...s, type: 'salary', category: 'Salary' })),
        ...bills.map(b => ({ ...b, type: 'bill', category: 'Bill' })),
        ...receivables.map(r => ({ ...r, type: 'receivable', category: 'Receivable' }))
    ].sort((a, b) => a.due_in_days - b.due_in_days);

    return (
        <div className="homepage">
            {/* HERO SECTION */}
            <header className="hero-section">
                <div className="hero-content">
                    <div className="brand">

                        <div className="brand-text">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                {/* <span className="logo-icon" style={{ marginBottom: '64px' }}>F</span> */}
                                <h1 >FinLy <br />
                                    Your Autonomous Finance Agent</h1>
                            </div>
                            <p>Enter your cash, bills, and receivables. FinLy will predict risks and act for you.</p>
                        </div>
                    </div>

                    <div className="hero-actions">
                        <button
                            className={`primary-action ${isAnalyzing ? 'analyzing' : ''}`}
                            onClick={runAnalysis}
                            disabled={isAnalyzing}
                        >
                            {isAnalyzing ? (
                                <>
                                    <span className="spinner"></span>
                                    <span>Simulating futures...</span>
                                </>
                            ) : (
                                <>
                                    <span>Run Financial Simulation</span>

                                </>
                            )}
                        </button>
                        <button className="secondary-action" onClick={checkDashboard}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span>View Last Analysis</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="main-container">
                {/* METRICS SECTION */}
                <section className="metrics-section">
                    <div className="metric-card balance-card">
                        <label>Cash in Bank</label>
                        <div className="metric-value editable">
                            <span className="currency">₹</span>
                            <input
                                type="number"
                                value={financeData.cash_balance}
                                onChange={(e) => setFinanceData(prev => ({ ...prev, cash_balance: parseInt(e.target.value) || 0 }))}
                                className="balance-input"
                                placeholder="Enter cash balance"
                            />
                        </div>
                    </div>

                    <div className="metric-card emphasized">
                        <label>Money Coming In</label>
                        <div className="metric-value positive">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>₹{stats.totalInflow.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="metric-card emphasized">
                        <label>Money Going Out</label>
                        <div className="metric-value negative">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 4V12M8 12L12 8M8 12L4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>₹{stats.totalOutflow.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className={`metric-card emphasized ${stats.netPosition >= 0 ? 'positive-emphasis' : 'negative-emphasis'}`}>
                        <label>FinLy’s Cash Forecast</label>
                        <div className={`metric-value ${stats.netPosition >= 0 ? 'positive' : 'negative'}`}>
                            <span>₹{stats.netPosition.toLocaleString()}</span>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '13px', color: stats.netPosition >= 0 ? '#34d399' : '#fb7185', fontWeight: 500 }}>
                            {stats.netPosition >= 0 ? "You are projected to stay solvent" : "FinLy predicts a cash shortfall"}
                        </div>
                    </div>
                </section>

                {/* CONTENT GRID */}
                <div className="content-grid">
                    {/* LEFT COLUMN: INPUTS */}
                    <div className="left-column">
                        <section className="inputs-section glass-card">
                            <div className="section-header">
                                <div>
                                    <h2>What FinLy Knows About Your Business</h2>

                                </div>
                            </div>

                            <div className="tabs">
                                <button
                                    className={`tab ${activeTab === 'salaries' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('salaries')}
                                >
                                    Team Payroll
                                </button>
                                <button
                                    className={`tab ${activeTab === 'bills' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('bills')}
                                >
                                    Fixed Expenses
                                </button>
                                <button
                                    className={`tab ${activeTab === 'receivables' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('receivables')}
                                >
                                    Client Payments
                                </button>
                            </div>

                            {/* Salaries Tab */}
                            {activeTab === 'salaries' && (
                                <div className="tab-content">
                                    <div className="input-row">
                                        <input
                                            type="text"
                                            placeholder="Team member"
                                            value={salary.employee}
                                            onChange={(e) => setSalary({ ...salary, employee: e.target.value })}
                                            className="input-field"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Monthly amount"
                                            value={salary.amount}
                                            onChange={(e) => setSalary({ ...salary, amount: e.target.value })}
                                            className="input-field"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Days until due"
                                            value={salary.due_in_days}
                                            onChange={(e) => setSalary({ ...salary, due_in_days: parseInt(e.target.value) })}
                                            className="input-field small"
                                        />
                                        <button className="add-button" onClick={addSalary}>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8 4V12M4 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="items-list">
                                        {salaries.map((s) => (
                                            <div key={s._id} className="list-item">
                                                <div className="item-info">
                                                    <div className="item-amount">₹{s.amount.toLocaleString()}</div>
                                                    <div className="item-due">Due in {s.due_in_days} days</div>
                                                    <div className="item-name">{s.employee}</div>
                                                </div>
                                                <button className="delete-button" onClick={() => deleteSalary(s._id)}>
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                        <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bills Tab */}
                            {activeTab === 'bills' && (
                                <div className="tab-content">
                                    <div className="input-row">
                                        <input
                                            type="text"
                                            placeholder="Expense name"
                                            value={bill.type}
                                            onChange={(e) => setBill({ ...bill, type: e.target.value })}
                                            className="input-field"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Monthly amount"
                                            value={bill.amount}
                                            onChange={(e) => setBill({ ...bill, amount: e.target.value })}
                                            className="input-field"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Days until due"
                                            value={bill.due_in_days}
                                            onChange={(e) => setBill({ ...bill, due_in_days: parseInt(e.target.value) })}
                                            className="input-field small"
                                        />
                                        <button className="add-button" onClick={addBill}>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8 4V12M4 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="items-list">
                                        {bills.map((b) => (
                                            <div key={b._id} className="list-item">
                                                <div className="item-info">
                                                    <div className="item-amount">₹{b.amount.toLocaleString()}</div>
                                                    <div className="item-due">Due in {b.due_in_days} days</div>
                                                    <div className="item-name">{b.type}</div>
                                                </div>
                                                <button className="delete-button" onClick={() => deleteBill(b._id)}>
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                        <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Receivables Tab */}
                            {activeTab === 'receivables' && (
                                <div className="tab-content">
                                    <div className="input-row">
                                        <input
                                            type="text"
                                            placeholder="Client"
                                            value={receivable.client}
                                            onChange={(e) => setReceivable({ ...receivable, client: e.target.value })}
                                            className="input-field"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            value={receivable.amount}
                                            onChange={(e) => setReceivable({ ...receivable, amount: e.target.value })}
                                            className="input-field"
                                        />
                                        <input
                                            type="email"
                                            placeholder="Client email"
                                            value={receivable.email}
                                            onChange={(e) => setReceivable({ ...receivable, email: e.target.value })}
                                            className="input-field"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Days until due"
                                            value={receivable.due_in_days}
                                            onChange={(e) => setReceivable({ ...receivable, due_in_days: parseInt(e.target.value) })}
                                            className="input-field small"
                                        />
                                        <button className="add-button" onClick={addReceivable}>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8 4V12M4 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    </div>



                                    <div className="items-list">
                                        {receivables.map((r) => (
                                            <div key={r._id} className="list-item">
                                                <div className="item-info">
                                                    <div className="item-amount">₹{r.amount.toLocaleString()}</div>
                                                    <div className="item-due">Due in {r.due_in_days} days</div>
                                                    <div className="item-name">{r.client} · {r.email}</div>
                                                </div>
                                                <button className="delete-button" onClick={() => deleteReceivable(r._id)}>
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                        <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* RIGHT COLUMN: TIMELINE */}
                    <aside className="right-column">
                        <section className="timeline-section glass-card">
                            <div className="section-header">
                                <div>
                                    <h2>FinLy’s Financial Future</h2>
                                    <p className="section-subtitle">What your next 30 days looks like if nothing changes</p>
                                </div>
                            </div>

                            <div className="timeline">
                                <div className="timeline-item current">
                                    <div className="timeline-marker"></div>
                                    <div className="timeline-content">
                                        <div className="timeline-label">Today (cash in bank)</div>
                                        <div className="timeline-value">₹{financeData.cash_balance.toLocaleString()}</div>
                                    </div>
                                </div>

                                {allItems.map((item, i) => {
                                    const isInflow = item.type === 'receivable';
                                    const name = item.employee || item.type || item.client;

                                    return (
                                        <div key={i} className={`timeline-item ${isInflow ? 'inflow' : 'outflow'}`}>
                                            <div className="timeline-marker"></div>
                                            <div className="timeline-content">
                                                <div className="timeline-label">{name}</div>
                                                <div className="timeline-meta">Day {item.due_in_days}</div>
                                                <div className={`timeline-value ${isInflow ? 'positive' : 'negative'}`}>
                                                    {isInflow ? '+' : '-'}₹{item.amount.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
