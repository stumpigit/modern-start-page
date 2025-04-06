import { Icon } from './Icon';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isWarning?: boolean;
  isImport?: boolean;
}

export default function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  isWarning = false,
  isImport = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-secondary-900 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold text-secondary-200 mb-4">{title}</h3>
        <p className="text-secondary-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          {isWarning ? (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
            >
              OK
            </button>
          ) : isImport ? (
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded bg-secondary-800 text-secondary-300 hover:bg-secondary-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
              >
                OK
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded bg-secondary-800 text-secondary-300 hover:bg-secondary-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 