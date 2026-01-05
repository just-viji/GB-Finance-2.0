
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
  fullPage?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = 'OK',
  confirmVariant = 'primary',
  hideFooter = false,
  fullPage = false
}) => {
  if (!isOpen) return null;

  const confirmButtonColors = {
    primary: 'bg-brand-primary hover:bg-brand-primary-hover',
    danger: 'bg-brand-accent hover:bg-red-600',
  };

  if (fullPage) {
    return (
      <div
        className="fixed inset-0 bg-white dark:bg-slate-950 z-[150] flex flex-col animate-slide-up no-scrollbar overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex-grow flex flex-col no-scrollbar">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 dark:bg-black/80 z-[150] flex justify-center items-center p-4"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md transform transition-all" 
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-lg font-bold leading-6 text-brand-dark dark:text-white" id="modal-title">
            {title}
          </h3>
          <div className="mt-4">
            <div className="text-sm text-brand-secondary dark:text-slate-400">
              {children}
            </div>
          </div>
        </div>
        {!hideFooter && (
            <div className="bg-gray-50 dark:bg-slate-800/50 px-6 py-3 flex flex-row-reverse gap-3 rounded-b-lg border-t dark:border-slate-800">
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
                    className="bg-white dark:bg-slate-900 py-2 px-4 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
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
