import { useI18n } from "../i18n";

const Modal = ({ open, title, subtitle, onClose, children, actions }) => {
  const { t } = useI18n();

  if (!open) {
    return null;
  }

  const handleBackdrop = (event) => {
    if (event.target === event.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex w-full max-w-lg flex-col rounded-3xl border border-border bg-white p-6 shadow-card max-h-[90vh]">
        <div className="flex items-start justify-between gap-4">
          <div>
            {subtitle ? (
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {subtitle}
              </p>
            ) : null}
            <h3 className="mt-1 text-xl font-semibold text-ink">{title}</h3>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-muted hover:text-ink"
            >
              {t("common.close", "Close")}
            </button>
          ) : null}
        </div>
        <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
        {actions ? (
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Modal;
