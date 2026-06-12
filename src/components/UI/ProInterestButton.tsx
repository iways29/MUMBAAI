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

  const handleButtonClick = () => {
    // Fire tracking events without blocking UI
    DatabaseService.trackProInterestEvent('button_click');
    setIsModalOpen(true);
    DatabaseService.trackProInterestEvent('modal_open');
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

  const handleDismiss = () => {
    // Fire tracking without blocking UI
    DatabaseService.trackProInterestEvent('dismissed');
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
        .pro-btn {
          font-family: var(--font-sans);
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--color-ash);
          background: transparent;
          border: 1px solid var(--color-hairline);
          border-radius: 24px;
          cursor: pointer;
          transition: color 120ms cubic-bezier(0.16, 1, 0.3, 1), border-color 120ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pro-btn:hover {
          color: var(--color-bone);
          border-color: var(--color-hairline-strong);
        }

        .pro-btn.pro-btn-large {
          padding: 12px 24px;
          font-size: 13px;
          gap: 10px;
        }

        .pro-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px 7px;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--color-bone);
          background: var(--color-plum);
          border-radius: 24px;
        }

        .pro-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 24px;
          animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pro-modal-overlay.closing {
          animation: fadeOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
          font-family: var(--font-sans);
          position: relative;
          width: 100%;
          max-width: 420px;
          background: var(--color-panel);
          border: 1px solid var(--color-hairline);
          border-radius: 24px;
          overflow: hidden;
          animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pro-modal-overlay.closing .pro-modal {
          animation: modalOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
          border-bottom: 1px solid var(--color-hairline);
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
          color: var(--color-smoke);
          transition: color 120ms ease, background 120ms ease;
        }

        .pro-modal-close:hover {
          background: var(--color-panel-2);
          color: var(--color-bone);
        }

        .pro-modal-title {
          font-size: 26px;
          font-weight: 200;
          color: var(--color-bone);
          margin: 0 0 14px;
          letter-spacing: -0.02em;
        }

        .pro-modal-subtitle {
          font-size: 15px;
          color: var(--color-ash);
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
          border-bottom: 1px solid var(--color-hairline);
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
          background: transparent;
          border: 1px solid var(--color-hairline);
          border-radius: 24px;
          font-size: 13px;
          color: var(--color-plum);
        }

        .pro-feature-content h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-bone);
          margin: 0 0 4px;
        }

        .pro-feature-content p {
          font-size: 13px;
          color: var(--color-ash);
          margin: 0;
          line-height: 1.45;
        }

        .pro-modal-footer {
          padding: 24px 32px 32px;
        }

        .pro-cta {
          width: 100%;
          padding: 14px 24px;
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--color-bone);
          background: var(--color-plum);
          border: none;
          border-radius: 24px;
          cursor: pointer;
          transition: background 120ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pro-cta:hover {
          background: var(--color-plum-hover);
        }

        .pro-cta:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pro-dismiss {
          width: 100%;
          padding: 10px;
          margin-top: 8px;
          font-family: var(--font-sans);
          font-size: 13px;
          color: var(--color-smoke);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 120ms ease;
        }

        .pro-dismiss:hover {
          color: var(--color-bone);
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
          border: 1px solid var(--color-plum);
          border-radius: 50%;
        }

        .pro-confirmed-icon svg {
          width: 24px;
          height: 24px;
          color: var(--color-plum);
        }

        .pro-confirmed h3 {
          font-size: 22px;
          font-weight: 400;
          color: var(--color-bone);
          margin: 0 0 8px;
        }

        .pro-confirmed p {
          font-size: 14px;
          color: var(--color-ash);
          margin: 0 0 28px;
          line-height: 1.5;
        }

        .pro-done-btn {
          display: inline-flex;
          padding: 12px 28px;
          font-family: var(--font-sans);
          font-size: 14px;
          font-weight: 500;
          color: var(--color-bone);
          background: transparent;
          border: 1px solid var(--color-hairline);
          border-radius: 24px;
          cursor: pointer;
          transition: border-color 120ms ease;
        }

        .pro-done-btn:hover {
          border-color: var(--color-hairline-strong);
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
          border: 1px solid var(--color-plum);
          border-radius: 50%;
        }

        .pro-already-joined-icon svg {
          width: 28px;
          height: 28px;
          color: var(--color-plum);
        }

        .pro-already-joined h3 {
          font-size: 24px;
          font-weight: 400;
          color: var(--color-bone);
          margin: 0 0 12px;
        }

        .pro-already-joined p {
          font-size: 15px;
          color: var(--color-ash);
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
