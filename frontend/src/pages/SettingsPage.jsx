import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SettingsPage = () => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const [settings, setSettings] = useState({
        riskTolerance: 50,
        salaryProtection: true,
        vendorProtection: true,
        automationLevel: 'ask',
        followUpTone: 'friendly',
        learningMode: true
    });

    useEffect(() => {
        const loadSettings = async () => {
            const saved = localStorage.getItem('finly_settings');
            if (saved) {
                setSettings(JSON.parse(saved));
            }
        };
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaveMessage('');

        try {
            localStorage.setItem('finly_settings', JSON.stringify(settings));
            setSaveMessage('✓ Settings saved successfully');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            console.error('Failed to save settings', error);
            setSaveMessage('✗ Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const getRiskToleranceLabel = (value) => {
        if (value < 30) return 'Conservative';
        if (value < 70) return 'Balanced';
        return 'Aggressive';
    };

    const getRiskToleranceColor = (value) => {
        if (value < 30) return '#34d399';
        if (value < 70) return '#a78bfa';
        return '#fb7185';
    };

    const getRiskToleranceDescription = (value) => {
        if (value < 30) return 'FinLy will be cautious, wait longer before acting, and use gentle language.';
        if (value < 70) return 'FinLy will monitor actively and take action when needed.';
        return 'FinLy will act quickly, send reminders sooner, and escalate faster.';
    };

    return (
        <div className="homepage">
            {/* Header */}
            <div className="hero-section" style={{ padding: '20px 0', marginBottom: '32px' }}>
                <div className="hero-content">
                    <div className="brand">
                        <span className="logo-icon">⚙️</span>
                        <div className="brand-text">
                            <h1 style={{ fontSize: '32px', marginBottom: '4px' }}>Control Panel</h1>
                            <p style={{ fontSize: '15px' }}>Fine-tune FinLy's autonomy & behavior</p>
                        </div>
                    </div>
                    <div className="hero-actions">
                        <button className="secondary-action" onClick={() => navigate('/dashboard')}>
                            <span>Dashboard</span>
                        </button>
                        <button className="primary-action" onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <>
                                    <span className="spinner"></span>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>Save Settings</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="main-container">
                {/* Save Message */}
                {saveMessage && (
                    <div style={{
                        padding: '14px 20px',
                        marginBottom: '28px',
                        background: saveMessage.includes('✓') ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.12)',
                        border: `1px solid ${saveMessage.includes('✓') ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 113, 133, 0.3)'}`,
                        borderRadius: '12px',
                        color: saveMessage.includes('✓') ? '#34d399' : '#fb7185',
                        fontSize: '14px',
                        fontWeight: '600',
                        textAlign: 'center',
                        animation: 'slideDown 0.3s ease-out'
                    }}>
                        {saveMessage}
                    </div>
                )}

                {/* Settings Grid - 2 Column Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>

                    {/* 1. Risk Tolerance */}
                    <div className="glass-card" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>

                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#e2e8f0', margin: 0 }}>
                                    Risk Tolerance
                                </h2>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                                    How aggressively FinLy should act
                                </p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Conservative</span>
                                <div style={{
                                    padding: '6px 16px',
                                    borderRadius: '8px',
                                    background: `${getRiskToleranceColor(settings.riskTolerance)}20`,
                                    border: `1px solid ${getRiskToleranceColor(settings.riskTolerance)}40`
                                }}>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: getRiskToleranceColor(settings.riskTolerance) }}>
                                        {getRiskToleranceLabel(settings.riskTolerance)}
                                    </span>
                                </div>
                                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Aggressive</span>
                            </div>

                            <div style={{ position: 'relative', height: '8px', marginBottom: '8px' }}>
                                <div style={{
                                    width: '100%',
                                    height: '8px',
                                    borderRadius: '4px',
                                    background: 'rgba(255,255,255,0.05)',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${settings.riskTolerance}%`,
                                        height: '100%',
                                        background: `linear-gradient(90deg, #34d399 0%, ${getRiskToleranceColor(settings.riskTolerance)} 100%)`,
                                        transition: 'width 0.3s ease, background 0.3s ease',
                                        boxShadow: `0 0 12px ${getRiskToleranceColor(settings.riskTolerance)}60`
                                    }}></div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={settings.riskTolerance}
                                    onChange={(e) => setSettings({ ...settings, riskTolerance: parseInt(e.target.value) })}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '8px',
                                        opacity: 0,
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                                <span style={{ fontSize: '11px', color: '#475569', fontWeight: '500' }}>0</span>
                                <span style={{ fontSize: '11px', color: '#475569', fontWeight: '500' }}>{settings.riskTolerance}</span>
                                <span style={{ fontSize: '11px', color: '#475569', fontWeight: '500' }}>100</span>
                            </div>
                        </div>

                        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', borderLeft: `3px solid ${getRiskToleranceColor(settings.riskTolerance)}` }}>
                            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                                {getRiskToleranceDescription(settings.riskTolerance)}
                            </p>
                        </div>
                    </div>

                    {/* 2. Protection Rules */}
                    <div className="glass-card" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>

                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#e2e8f0', margin: 0 }}>
                                    Protection Rules
                                </h2>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                                    What FinLy should never compromise
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Salary Protection */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '18px',
                                background: settings.salaryProtection ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${settings.salaryProtection ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                                borderRadius: '12px',
                                transition: 'all 0.3s ease'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>

                                        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#e2e8f0', margin: 0 }}>
                                            Never Delay Salaries
                                        </h3>
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0 26px' }}>
                                        Always prioritize team payroll over other expenses
                                    </p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.salaryProtection}
                                        onChange={(e) => setSettings({ ...settings, salaryProtection: e.target.checked })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            {/* Vendor Protection */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '18px',
                                background: settings.vendorProtection ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${settings.vendorProtection ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                                borderRadius: '12px',
                                transition: 'all 0.3s ease'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>

                                        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#e2e8f0', margin: 0 }}>
                                            Protect Vendor Relationships
                                        </h3>
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0 26px' }}>
                                        Avoid delaying critical vendor payments
                                    </p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.vendorProtection}
                                        onChange={(e) => setSettings({ ...settings, vendorProtection: e.target.checked })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* 3. Action Automation - Full Width */}
                    <div className="glass-card" style={{ padding: '32px', gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>

                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#e2e8f0', margin: 0 }}>
                                    Action Automation Level
                                </h2>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                                    How autonomous should FinLy be when taking actions?
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                            {[
                                {
                                    value: 'auto',
                                    icon: '',
                                    label: 'Full Autopilot',
                                    desc: 'FinLy sends reminders automatically without asking',
                                    color: '#a78bfa'
                                },
                                {
                                    value: 'ask',
                                    icon: '',
                                    label: 'Ask Before Acting',
                                    desc: 'FinLy prepares emails but waits for your approval',
                                    color: '#38bdf8'
                                },
                                {
                                    value: 'alert',
                                    icon: '',
                                    label: 'Alerts Only',
                                    desc: 'FinLy only alerts you, takes no automatic action',
                                    color: '#fbbf24'
                                }
                            ].map(option => (
                                <label
                                    key={option.value}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: '20px',
                                        background: settings.automationLevel === option.value ? `${option.color}15` : 'rgba(255,255,255,0.02)',
                                        border: `2px solid ${settings.automationLevel === option.value ? option.color : 'rgba(255,255,255,0.06)'}`,
                                        borderRadius: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        transform: settings.automationLevel === option.value ? 'translateY(-2px)' : 'none',
                                        boxShadow: settings.automationLevel === option.value ? `0 8px 24px ${option.color}25` : 'none'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                        <input
                                            type="radio"
                                            name="automation"
                                            value={option.value}
                                            checked={settings.automationLevel === option.value}
                                            onChange={(e) => setSettings({ ...settings, automationLevel: e.target.value })}
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                accentColor: option.color,
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <span style={{ fontSize: '24px' }}>{option.icon}</span>
                                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#e2e8f0' }}>
                                            {option.label}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', paddingLeft: '32px' }}>
                                        {option.desc}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 4. Follow-Up Tone */}
                    <div className="glass-card" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>

                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#e2e8f0', margin: 0 }}>
                                    Communication Tone
                                </h2>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                                    How FinLy should communicate with clients
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                            {[
                                { value: 'friendly', label: 'Friendly', emoji: '', desc: 'Warm & casual', color: '#34d399' },
                                { value: 'firm', label: 'Firm', emoji: '', desc: 'Professional', color: '#a78bfa' },
                                { value: 'legal', label: 'Legal', emoji: '', desc: 'Formal & strict', color: '#fb7185' }
                            ].map(tone => (
                                <button
                                    key={tone.value}
                                    onClick={() => setSettings({ ...settings, followUpTone: tone.value })}
                                    style={{
                                        padding: '24px 16px',
                                        background: settings.followUpTone === tone.value ? `${tone.color}15` : 'rgba(255,255,255,0.02)',
                                        border: `2px solid ${settings.followUpTone === tone.value ? tone.color : 'rgba(255,255,255,0.05)'}`,
                                        borderRadius: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        textAlign: 'center',
                                        transform: settings.followUpTone === tone.value ? 'scale(1.05)' : 'scale(1)',
                                        boxShadow: settings.followUpTone === tone.value ? `0 8px 20px ${tone.color}30` : 'none'
                                    }}
                                >
                                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>{tone.emoji}</div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: settings.followUpTone === tone.value ? tone.color : '#e2e8f0', marginBottom: '4px' }}>
                                        {tone.label}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                                        {tone.desc}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 5. Learning Mode */}
                    <div className="glass-card" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>

                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#e2e8f0', margin: '0 0 8px 0' }}>
                                        AI Learning Mode
                                    </h2>
                                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.5', maxWidth: '420px' }}>
                                        When enabled, FinLy learns from client responses and adjusts its strategy over time (who to pressure, optimal timing)
                                    </p>
                                </div>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.learningMode}
                                    onChange={(e) => setSettings({ ...settings, learningMode: e.target.checked })}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                </div>


            </div>

            <style>{`
                .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 56px;
                    height: 30px;
                    flex-shrink: 0;
                }

                .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(255,255,255,0.1);
                    transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    border-radius: 30px;
                }

                .toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 22px;
                    width: 22px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    border-radius: 50%;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                }

                .toggle-switch input:checked + .toggle-slider {
                    background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
                    box-shadow: 0 0 16px rgba(52, 211, 153, 0.4);
                }

                .toggle-switch input:checked + .toggle-slider:before {
                    transform: translateX(26px);
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default SettingsPage;
