import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  isDanger = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-overlay)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onCancel}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '320px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 20px 16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isDanger ? 'var(--danger)' : 'var(--accent)',
              color: isDanger ? '#ffffff' : '#ffffff',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
