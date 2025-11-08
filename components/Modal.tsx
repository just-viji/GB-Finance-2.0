import React from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  confirmVariant?: 'primary' | 'danger';
  hideFooter?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = 'OK',
  confirmVariant = 'primary',
  hideFooter = false
}) => {
  if (!isOpen) return null;

  const confirmButtonColors = {
    primary: 'bg-brand-primary hover:bg-brand-primary-hover',
    danger: 'bg-brand-accent hover:bg-red-600',
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all" 
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-lg font-bold leading-6 text-brand-dark" id="modal-title">
            {title}
          </h3>
          <div className="mt-4">
            <div className="text-sm text-brand-secondary">
              {children}
            </div>
          </div>
        </div>
        {!hideFooter && (
            <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse gap-3 rounded-b-lg">
            <button
                type="button"
                className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 w-auto sm:text-sm transition-colors ${onConfirm ? confirmButtonColors[confirmVariant] : 'bg-brand-primary hover:bg-brand-primary-hover'}`}
                onClick={onConfirm || onClose}
            >
                {onConfirm ? confirmText : 'OK'}
            </button>
            {onConfirm && (
                <button
                    type="button"
                    onClick={onClose}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                >
                Cancel
                </button>
            )}
            </div>
        )}
      </div>
    </div>
  );
};

export default Modal;