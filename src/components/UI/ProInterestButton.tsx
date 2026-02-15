import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DatabaseService } from '../../services/databaseService.ts';

interface ProInterestButtonProps {
  className?: string;
  large?: boolean;
}

export const ProInterestButton: React.FC<ProInterestButtonProps> = ({ className = '', large = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasAlreadyJoined, setHasAlreadyJoined] = useState(false);

  // Check if user has already joined the waitlist
  useEffect(() => {
    const joined = localStorage.getItem('mumbaai_pro_waitlist_joined');
    if (joined === 'true') {
      setHasAlreadyJoined(true);
    }
  }, []);

  const handleButtonClick = async () => {
    await DatabaseService.trackProInterestEvent('button_click');
    setIsModalOpen(true);
    await DatabaseService.trackProInterestEvent('modal_open');
  };

  const handleConfirmInterest = async () => {
    setIsLoading(true);
    await DatabaseService.trackProInterestEvent('confirmed_interest', {
      confirmed_at: new Date().toISOString()
    });
    // Persist to localStorage
    localStorage.setItem('mumbaai_pro_waitlist_joined', 'true');
    setHasAlreadyJoined(true);
    setIsLoading(false);
    setIsConfirmed(true);
  };

  const handleDismiss = async () => {
    await DatabaseService.trackProInterestEvent('dismissed');
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsConfirmed(false);
      setIsClosing(false);
    }, 200);
  };

  const handleCloseAfterConfirm = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsConfirmed(false);
      setIsClosing(false);
    }, 200);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Instrument+Serif:ital@0;1&display=swap');

        .pro-btn {
          font-family: 'DM Sans', system-ui, sans-serif;
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.01em;
          color: #1a1a1a;
          background: linear-gradient(135deg, #faf9f7 0%, #f5f3ef 100%);
          border: 1px solid #e8e4dc;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }

        .pro-btn:hover {
          background: linear-gradient(135deg, #f5f3ef 0%, #ebe7df 100%);
          border-color: #d4cfc3;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transform: translateY(-1px);
        }

        .pro-btn:active {
          transform: translateY(0);
        }

        .pro-btn.pro-btn-large {
          padding: 12px 24px;
          font-size: 15px;
          gap: 10px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .pro-btn.pro-btn-large .pro-badge {
          padding: 4px 10px;
          font-size: 10px;
        }

        .pro-btn.pro-btn-large:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          transform: translateY(-2px);
        }

        .pro-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px 6px;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #8b7355;
          background: linear-gradient(135deg, #f0ebe3 0%, #e8e0d4 100%);
          border-radius: 3px;
        }

        .pro-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 12, 8, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 24px;
          animation: fadeIn 0.2s ease;
        }

        .pro-modal-overlay.closing {
          animation: fadeOut 0.2s ease forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        .pro-modal {
          font-family: 'DM Sans', system-ui, sans-serif;
          position: relative;
          width: 100%;
          max-width: 420px;
          background: #fdfcfa;
          border-radius: 16px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.03),
            0 24px 48px -12px rgba(0,0,0,0.25),
            0 0 80px -20px rgba(139, 115, 85, 0.15);
          animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pro-modal-overlay.closing .pro-modal {
          animation: modalOut 0.2s ease forwards;
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes modalOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
        }

        .pro-modal-header {
          position: relative;
          padding: 40px 36px 32px;
          background: linear-gradient(180deg, #f8f6f2 0%, #fdfcfa 100%);
          border-bottom: 1px solid #ebe7df;
        }

        .pro-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          color: #9a8f7f;
          transition: all 0.15s ease;
        }

        .pro-modal-close:hover {
          background: #f0ebe3;
          color: #6b5d4d;
        }

        .pro-modal-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 30px;
          font-weight: 400;
          color: #1a1714;
          margin: 0 0 14px;
          letter-spacing: -0.01em;
        }

        .pro-modal-subtitle {
          font-size: 15px;
          color: #7a7062;
          margin: 0;
          line-height: 1.6;
          max-width: 340px;
        }

        .pro-modal-body {
          padding: 28px 32px;
        }

        .pro-feature {
          display: flex;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid #f0ebe3;
        }

        .pro-feature:last-child {
          border-bottom: none;
        }

        .pro-feature-marker {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f6f2;
          border: 1px solid #ebe7df;
          border-radius: 8px;
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 15px;
          font-style: italic;
          color: #8b7355;
        }

        .pro-feature-content h4 {
          font-size: 14px;
          font-weight: 600;
          color: #2a2520;
          margin: 0 0 4px;
        }

        .pro-feature-content p {
          font-size: 13px;
          color: #7a7062;
          margin: 0;
          line-height: 1.45;
        }

        .pro-modal-footer {
          padding: 24px 32px 32px;
          background: #fdfcfa;
        }

        .pro-cta {
          width: 100%;
          padding: 14px 24px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.01em;
          color: #fdfcfa;
          background: linear-gradient(135deg, #3d3429 0%, #2a2520 100%);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow:
            0 1px 2px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .pro-cta:hover {
          background: linear-gradient(135deg, #4a4035 0%, #3d3429 100%);
          transform: translateY(-1px);
          box-shadow:
            0 4px 12px rgba(0,0,0,0.15),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .pro-cta:active {
          transform: translateY(0);
        }

        .pro-cta:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .pro-dismiss {
          width: 100%;
          padding: 10px;
          margin-top: 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 13px;
          color: #9a8f7f;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .pro-dismiss:hover {
          color: #6b5d4d;
        }

        .pro-confirmed {
          padding: 48px 32px;
          text-align: center;
        }

        .pro-confirmed-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f0ebe3 0%, #e8e0d4 100%);
          border-radius: 50%;
        }

        .pro-confirmed-icon svg {
          width: 24px;
          height: 24px;
          color: #6b5d4d;
        }

        .pro-confirmed h3 {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 24px;
          font-weight: 400;
          color: #1a1714;
          margin: 0 0 8px;
        }

        .pro-confirmed p {
          font-size: 14px;
          color: #7a7062;
          margin: 0 0 28px;
          line-height: 1.5;
        }

        .pro-done-btn {
          display: inline-flex;
          padding: 12px 28px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #2a2520;
          background: #f8f6f2;
          border: 1px solid #e8e4dc;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pro-done-btn:hover {
          background: #f0ebe3;
          border-color: #d4cfc3;
        }

        .pro-already-joined {
          padding: 48px 36px;
          text-align: center;
        }

        .pro-already-joined-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          border-radius: 50%;
        }

        .pro-already-joined-icon svg {
          width: 28px;
          height: 28px;
          color: #4caf50;
        }

        .pro-already-joined h3 {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 26px;
          font-weight: 400;
          color: #1a1714;
          margin: 0 0 12px;
        }

        .pro-already-joined p {
          font-size: 15px;
          color: #7a7062;
          margin: 0 0 32px;
          line-height: 1.6;
        }
      `}</style>

      {/* Try Pro Button */}
      <button onClick={handleButtonClick} className={`pro-btn ${large ? 'pro-btn-large' : ''} ${className}`}>
        <span className="pro-badge">Pro</span>
        <span>Try Pro</span>
      </button>

      {/* Modal - rendered via portal to escape navbar stacking context */}
      {isModalOpen && createPortal(
        <div className={`pro-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleDismiss}>
          <div className="pro-modal" onClick={(e) => e.stopPropagation()}>
            {hasAlreadyJoined && !isConfirmed ? (
              // Already joined state - shown when user returns after previously joining
              <div className="pro-already-joined">
                <div className="pro-already-joined-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3>You're on the waitlist</h3>
                <p>Thanks for your interest in MUMBAAI Pro. We'll notify you as soon as it's ready to launch.</p>
                <button className="pro-done-btn" onClick={handleCloseAfterConfirm}>
                  Got it
                </button>
              </div>
            ) : !isConfirmed ? (
              <>
                <div className="pro-modal-header">
                  <button className="pro-modal-close" onClick={handleDismiss}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <h2 className="pro-modal-title">Unlock MUMBAAI Pro</h2>
                  <p className="pro-modal-subtitle">
                    Get early access to premium features and shape the future of conversational AI.
                  </p>
                </div>

                <div className="pro-modal-body">
                  <div className="pro-feature">
                    <div className="pro-feature-marker">i</div>
                    <div className="pro-feature-content">
                      <h4>Infinite branching</h4>
                      <p>Unlimited conversation trees, branches, and merge operations</p>
                    </div>
                  </div>
                  <div className="pro-feature">
                    <div className="pro-feature-marker">ii</div>
                    <div className="pro-feature-content">
                      <h4>Premium models</h4>
                      <p>Access GPT-4o, Claude Opus, and latest frontier models</p>
                    </div>
                  </div>
                  <div className="pro-feature">
                    <div className="pro-feature-marker">iii</div>
                    <div className="pro-feature-content">
                      <h4>Advanced workflows</h4>
                      <p>Custom templates, team collaboration, and analytics</p>
                    </div>
                  </div>
                </div>

                <div className="pro-modal-footer">
                  <button
                    className="pro-cta"
                    onClick={handleConfirmInterest}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Joining...' : 'Join the waitlist'}
                  </button>
                  <button className="pro-dismiss" onClick={handleDismiss}>
                    Maybe another time
                  </button>
                </div>
              </>
            ) : (
              <div className="pro-confirmed">
                <div className="pro-confirmed-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3>You're on the list</h3>
                <p>We'll reach out when Pro is ready. Thanks for your interest.</p>
                <button className="pro-done-btn" onClick={handleCloseAfterConfirm}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
