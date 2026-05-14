'use client';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDouble?: boolean;
  step?: 1 | 2;
}

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  isDouble = false,
  step = 1
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-card" onClick={e => e.stopPropagation()}>
        <div className="confirm-header">
          <div className="confirm-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h3 className="confirm-title">{isDouble && step === 2 ? '⚠️ ¿ESTÁS COMPLETAMENTE SEGURO?' : title}</h3>
        </div>
        <div className="confirm-body">
          <p>{message}</p>
          {isDouble && step === 1 && (
            <p style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
              Esta acción requiere una segunda confirmación.
            </p>
          )}
        </div>
        <div className="confirm-footer">
          <button className="btn-confirm-cancel" onClick={onCancel}>{cancelText}</button>
          <button className="btn-confirm-danger" onClick={onConfirm}>
            {isDouble && step === 1 ? 'Siguiente paso' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
