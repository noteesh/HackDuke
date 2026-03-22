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
  const [recipientEmail, setRecipientEmail]   = useState('');
  const [recipientName, setRecipientName]     = useState('');
  const [sending, setSending]                 = useState(false);
  const [sendStatus, setSendStatus]           = useState(null);

  // Call Lawyer state
  const [showCallModal, setShowCallModal]     = useState(false);
  const [phoneNumber, setPhoneNumber]         = useState('');
  const [calling, setCalling]                 = useState(false);
  const [callStatus, setCallStatus]           = useState(null); // null | 'success' | 'error'

  if (!text) return null;

  const isValidEmail = (email) => email && email.includes('@') && email.includes('.');
  const canSend = !streaming && text && isValidEmail(recipientEmail) && !sending;

  // ── Send Appeal ────────────────────────────────────────────────────────────
  const handleSendAppeal = async () => {
    if (!canSend) return;
    setSending(true);
    setSendStatus(null);

    try {
      const response = await fetch('/api/send-appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          recipientName:  recipientName.trim(),
          appealText:     text,
          userEmail:      user?.email || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSendStatus({ type: 'success', message: data.message || 'Appeal sent successfully to ' + recipientEmail });
        setRecipientEmail('');
        setRecipientName('');
      } else {
        setSendStatus({ type: 'error', message: data.message || data.error || 'Failed to send appeal' });
      }
    } catch (err) {
      setSendStatus({ type: 'error', message: 'Network error: ' + err.message });
    } finally {
      setSending(false);
    }
  };

  // ── Call Lawyer ────────────────────────────────────────────────────────────
  const handleCall = async () => {
    if (!phoneNumber || calling) return;
    setCalling(true);
    setCallStatus(null);

    // Build a concise spoken summary of the appeal letter for the call
    const lines = [
      "Hello, this is an automated message from The Override, an AI-powered legal analysis platform.",
      "We have generated a formal appeal letter on behalf of your client regarding a recent denial decision.",
      "The appeal was triggered after our AI agents identified conceded arguments that the defense could not rebut.",
      "The full appeal letter has been sent to your email. Please review it at your earliest convenience.",
      "Thank you for your time. Goodbye.",
    ];

    try {
      const response = await fetch('/api/call/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber.trim(), lines }),
      });

      const data = await response.json();

      if (response.ok) {
        setCallStatus('success');
        setTimeout(() => {
          setShowCallModal(false);
          setCallStatus(null);
          setPhoneNumber('');
        }, 2000);
      } else {
        setCallStatus('error');
        console.error('[Call] Error:', data);
      }
    } catch (err) {
      setCallStatus('error');
      console.error('[Call] Network error:', err);
    } finally {
      setCalling(false);
    }
  };

  return (
    <div className="animate-slide-up" style={{ background: '#0a0a0b' }}>

      {/* ── Banner ── */}
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

          {/* ── Call Lawyer button ── */}
          <button
            onClick={() => { setShowCallModal(true); setCallStatus(null); }}
            disabled={streaming}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: streaming ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.1)',
              color:      streaming ? '#3f3f46' : '#a5b4fc',
              border:     streaming ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(99,102,241,0.25)',
              cursor:     streaming ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!streaming) e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; }}
            onMouseLeave={e => { if (!streaming) e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.83a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Call Lawyer
          </button>

          {/* Copy button */}
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

          {/* Save PDF button */}
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

      {/* ── Call Lawyer Modal ── */}
      {showCallModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCallModal(false); }}
        >
          <div
            className="w-full max-w-sm mx-4 rounded-2xl p-6 animate-slide-up"
            style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.83a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Call Lawyer</div>
                  <div className="text-[11px]" style={{ color: '#52525b' }}>AI voice via ElevenLabs</div>
                </div>
              </div>
              <button
                onClick={() => setShowCallModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#52525b' }}
                onMouseEnter={e => e.currentTarget.style.color = '#a1a1aa'}
                onMouseLeave={e => e.currentTarget.style.color = '#52525b'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Phone input */}
            <div className="mb-4">
              <label className="block text-xs mb-1.5" style={{ color: '#71717a' }}>
                Phone Number <span style={{ color: '#fb7185' }}>*</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="+15551234567"
                className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-[#52525b] transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
              <p className="text-[11px] mt-1.5" style={{ color: '#3f3f46' }}>
                Include country code, e.g. +1 for US
              </p>
            </div>

            {/* Call button */}
            <button
              onClick={handleCall}
              disabled={!phoneNumber || calling}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={
                phoneNumber && !calling
                  ? { background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer' }
                  : { background: 'rgba(255,255,255,0.03)', color: '#3f3f46', border: '1px solid rgba(255,255,255,0.05)', cursor: 'not-allowed' }
              }
            >
              {calling ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Calling…
                </>
              ) : callStatus === 'success' ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Call Initiated
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.83a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Initiate Call
                </>
              )}
            </button>

            {/* Status */}
            {callStatus === 'error' && (
              <div
                className="mt-3 px-4 py-3 rounded-lg text-xs animate-slide-up"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                Call failed. Check your Twilio credentials and phone number format.
              </div>
            )}
            {callStatus === 'success' && (
              <div
                className="mt-3 px-4 py-3 rounded-lg text-xs animate-slide-up"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' }}
              >
                Call initiated — the lawyer's phone is ringing.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Letter content ── */}
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
                    onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="lawyer@lawfirm.com"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-[#52525b] transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#71717a] mb-1.5">
                    Recipient Name (optional)
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    placeholder="Law Firm Name or Attorney Name"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-[#52525b] transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>

                <button
                  onClick={handleSendAppeal}
                  disabled={!canSend}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={
                    canSend
                      ? { background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer' }
                      : { background: 'rgba(255,255,255,0.03)', color: '#3f3f46', border: '1px solid rgba(255,255,255,0.05)', cursor: 'not-allowed' }
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