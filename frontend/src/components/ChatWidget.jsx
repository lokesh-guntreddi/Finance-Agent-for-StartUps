import React, { useState, useEffect, useRef } from 'react';
import './ChatWidget.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/api/chat/history?sessionId=default`);
            if (res.ok) {
                const history = await res.json();
                setMessages(history);
            }
        } catch (error) {
            console.error("Failed to load chat history", error);
        }
    };

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/chat/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, sessionId: 'default' })
            });

            const data = await res.json();

            if (data.success) {
                // Construct enhanced assistant message
                const assistantMsg = {
                    role: 'assistant',
                    content: data.answer,
                    insights: data.key_insights,
                    followers: data.follow_up_suggestions
                };
                setMessages(prev => [...prev, assistantMsg]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Sorry, I encountered an error. Please try again." }]);
            }

        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "❌ Connection error. Is the backend running?" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = async () => {
        if (!window.confirm("Clear conversation history?")) return;
        try {
            await fetch(`${API_URL}/api/chat/clear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: 'default' })
            });
            setMessages([]);
        } catch (error) {
            console.error("Failed to clear", error);
        }
    };

    return (
        <div className="chat-widget">
            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <div className="chat-title">
                            FinLy Associate
                        </div>
                        <div className="chat-actions">
                            <button className="chat-action-btn" onClick={handleClear} title="Clear History">
                                Delete
                            </button>
                            <button className="chat-action-btn" onClick={() => setIsOpen(false)} title="Close">
                                Close
                            </button>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {messages.length === 0 && (
                            <div className="message assistant" style={{ textAlign: 'center', color: '#94a3b8' }}>
                                <p>Hello! I'm your brutal financial assistant. Ask me anything about your cashflow, past decisions, or risks.</p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.role}`}>
                                <div className="message-content">{msg.content}</div>

                                {(msg.insights?.length > 0) && (
                                    <div className="msg-insights">
                                        {msg.insights.map((insight, i) => (
                                            <div key={i} className="insight-item"><span>!</span>{insight}</div>
                                        ))}
                                    </div>
                                )}

                                {(msg.followers?.length > 0 && idx === messages.length - 1) && (
                                    <div className="follow-up-chips">
                                        {msg.followers.map((q, i) => (
                                            <div key={i} className="chip" onClick={() => handleSend(q)}>
                                                {q}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="message assistant">
                                <div className="typing-indicator">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Ask about your finances..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isLoading}
                        />
                        <button className="send-btn" onClick={() => handleSend()} disabled={isLoading || !input.trim()}>
                            ➤
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button className="chat-toggle" onClick={() => setIsOpen(true)}>
                    <span style={{ fontSize: '24px' }}>💬</span>
                </button>
            )}
        </div>
    );
};

export default ChatWidget;
