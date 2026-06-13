import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-2 rounded-full animate-spin`}
        style={{ borderColor: 'var(--color-hairline)', borderTopColor: 'var(--color-plum)' }}
      />
      {text && <span className="text-sm text-ash tracking-body">{text}</span>}
    </div>
  );
};

export const ThinkingIndicator: React.FC<{ text?: string }> = ({ text = 'Thinking…' }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-panel border border-hairline rounded-node">
    <div className="flex gap-1.5">
      <div className="w-1.5 h-1.5 bg-smoke rounded-full caret-pulse" style={{ animationDelay: '0ms' }} />
      <div className="w-1.5 h-1.5 bg-smoke rounded-full caret-pulse" style={{ animationDelay: '160ms' }} />
      <div className="w-1.5 h-1.5 bg-smoke rounded-full caret-pulse" style={{ animationDelay: '320ms' }} />
    </div>
    <span className="text-sm text-ash tracking-body">{text}</span>
  </div>
);

export const MergeIndicator: React.FC<{ text?: string }> = ({ text = 'Merging branches…' }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-panel border border-plum rounded-node">
    <div
      className="w-4 h-4 border-2 rounded-full animate-spin"
      style={{ borderColor: 'var(--color-plum-soft)', borderTopColor: 'var(--color-plum)' }}
    />
    <span className="text-sm text-bone tracking-body">{text}</span>
  </div>
);
