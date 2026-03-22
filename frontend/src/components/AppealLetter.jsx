import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  });
}

function downloadAsPDF() {
  window.print();
}

export default function AppealLetter({ text, streaming }) {
  const { user } = useAuth0();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  if (!text) return null;

  const isValidEmail = (email) => {
    return email && email.includes('@') && email.includes('.');
  };

  const canSend = !streaming && text && isValidEmail(recipientEmail) && !sending;

  const handleSendAppeal = async () => {
    if (!canSend) return;

    setSending(true);
    setSendStatus(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/send-appeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          recipientName: recipientName.trim(),
          appealText: text,
          userEmail: user?.email || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSendStatus({ 
          type: 'success', 
          message: data.demo 
            ? 'Appeal prepared successfully (email provider not configured - check server logs)'
            : 'Appeal sent successfully to ' + recipientEmail 
        });
        setRecipientEmail('');
        setRecipientName('');
      } else {
        setSendStatus({ 
          type: 'error', 
          message: data.error || 'Failed to send appeal' 
        });
      }
    } catch (err) {
      setSendStatus({ 
        type: 'error', 
        message: 'Network error: ' + err.message 
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-slide-up" style={{ background: '#0a0a0b' }}>
      {/* Banner */}
      <div
        className="px-6 py-3 flex items-center justify-between"
        style={{ background: 'rgba(244,63,94,0.06)', borderBottom: '1px solid rgba(244,63,94,0.15)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Appeal Letter Generated</div>
            <div className="text-xs" style={{ color: '#71717a' }}>
              Built from conceded arguments — the defense could not rebut these
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(text)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy
          </button>
          <button
            onClick={downloadAsPDF}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: '1px solid rgba(99,102,241,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #818cf8, #6366f1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Save PDF
          </button>
        </div>
      </div>

      {/* Letter content */}
      <div className="max-w-4xl mx-auto p-8" id="appeal-print">
        <div
          className={`agent-content text-sm leading-loose ${streaming ? 'cursor-blink' : ''}`}
          style={{ color: '#d4d4d8', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}
        >
          {text}
        </div>

        {/* Send to Lawyer Section */}
        {!streaming && (
          <div className="mt-8 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <h3 className="text-sm font-semibold text-white">Send to Lawyer</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#71717a] mb-1.5">
                    Recipient Email <span className="text-[#fb7185]">*</span>
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="lawyer@lawfirm.com"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-[#52525b] transition-all"
                    style={{ 
                      background: 'rgba(255,255,255,0.04)', 
                      border: '1px solid rgba(255,255,255,0.08)',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.4)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#71717a] mb-1.5">
                    Recipient Name (optional)
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Law Firm Name or Attorney Name"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-[#52525b] transition-all"
                    style={{ 
                      background: 'rgba(255,255,255,0.04)', 
                      border: '1px solid rgba(255,255,255,0.08)',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.4)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>

                <button
                  onClick={handleSendAppeal}
                  disabled={!canSend}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={
                    canSend
                      ? { 
                          background: 'linear-gradient(135deg, #10b981, #059669)', 
                          color: 'white',
                          border: '1px solid rgba(16,185,129,0.3)',
                          cursor: 'pointer'
                        }
                      : { 
                          background: 'rgba(255,255,255,0.03)', 
                          color: '#3f3f46',
                          border: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'not-allowed'
                        }
                  }
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      Send to Lawyer
                    </>
                  )}
                </button>

                {sendStatus && (
                  <div
                    className="px-4 py-3 rounded-lg text-xs leading-relaxed animate-slide-up"
                    style={
                      sendStatus.type === 'success'
                        ? { background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' }
                        : { background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }
                    }
                  >
                    {sendStatus.message}
                  </div>
                )}

                <p className="text-xs text-[#52525b] leading-relaxed">
                  The email will be sent from the app's email address with your email ({user?.email || 'not available'}) set as reply-to.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
