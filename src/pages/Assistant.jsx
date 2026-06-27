import { useState, useEffect, useRef } from 'react';
import { sendMessage } from '../api/chat';

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Rohana Credit assistant. Ask me anything about how the system works — creating loans, recording payments, understanding reports, exporting reports as PDF, or loan management tips.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
  if (!loading) { setElapsed(0); return; }
  const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
  return () => clearInterval(interval);
}, [loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');

    const userMessage = { role: 'user', content: question };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const { answer } = await sendMessage(question, history);
      setMessages([...newMessages, { role: 'assistant', content: answer }]);
      setLoading(false);
    } catch (err) {
      const status = err?.response?.status;
      let errorMsg = 'Sorry, something went wrong. Please try again.';
      if (status === 503 || status === 429) {
        errorMsg = 'The server is busy right now. Please wait a moment and try again.';
        } else if (status === 504 || err?.code === 'ECONNABORTED') {
            errorMsg = 'The request timed out — the AI is taking too long. Try a shorter question.';
        }
      setMessages([...newMessages, { role: 'assistant', content: errorMsg }]);
      setLoading(false);
    }
  };

  const suggestions = [
    'Who has overdue loans?',
    'Show customers with payments due this week.',
    'What was our total collection in May?',
    'Which customers borrowed more than Rs. 500,000?',
    'Export the current report as PDF.',
  ];

  return (
    <>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: '0.25rem' }}>Assistant</h1>
      <p className="text-muted" style={{ fontSize: 13, marginBottom: '1.25rem' }}>
        Ask anything about how Rohana Credit works.
      </p>

      <div className="assistant-top-grid">
        <div className="card">
          <p className="card-title">Suggested questions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {suggestions.map((s) => (
              <button
                key={s}
                className="btn btn-ghost"
                style={{ textAlign: 'left', fontSize: 12, padding: '0.55rem 0.75rem' }}
                onClick={() => setInput(s)}
                disabled={loading}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <p className="card-title">What I can help with</p>
          <ul style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: '1rem', lineHeight: 2 }}>
            <li>Live loan and payment insights</li>
            <li>Data-driven report queries</li>
            <li>Export reports as PDF</li>
            <li>Recording payments</li>
            <li>Printing receipts</li>
            <li>Loan management tips</li>
          </ul>
        </div>
      </div>

      <div className="card assistant-chat-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0', marginBottom: '1rem' }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '0.875rem',
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--rc-purple-light)', color: 'var(--rc-purple-text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 500, flexShrink: 0, marginRight: 10, marginTop: 2,
                }}>
                  RC
                </div>
              )}
              <div style={{
                maxWidth: '75%',
                padding: '0.625rem 0.875rem',
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: msg.role === 'user' ? 'var(--rc-purple)' : 'var(--bg-surface-2)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                fontSize: 13.5,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.875rem' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--rc-purple-light)', color: 'var(--rc-purple-text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500,
              }}>
                RC
              </div>
              <div style={{
                padding: '0.625rem 0.875rem',
                borderRadius: '12px 12px 12px 2px',
                background: 'var(--bg-surface-2)',
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}>
                Thinking{elapsed > 0 ? ` (${elapsed}s)` : '...'}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !input.trim()}
          >
            <i className="ti ti-send" aria-hidden="true" /> Send
          </button>
        </form>
      </div>
    </>
  );
}