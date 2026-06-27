type NotificationType = 'success' | 'error';

interface NotificationProps {
  type: NotificationType;
  message: string;
  onClose?: () => void;
}

export default function Notification({ type, message, onClose }: NotificationProps) {
  const className =
    type === 'success'
      ? 'border-green-200 bg-green-50 text-green-700'
      : 'border-red-200 bg-red-50 text-red-700';

  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span>{message}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-xs font-semibold hover:bg-black/5"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
