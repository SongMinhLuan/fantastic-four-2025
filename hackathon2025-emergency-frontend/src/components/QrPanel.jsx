import { useI18n } from "../i18n";
import Badge from "./Badge";

const QrPanel = ({ title, amount, note }) => {
  const { t } = useI18n();
  const label = title || t("qr.title", "Scan to pay");

  return (
    <div className="rounded-2xl border border-border bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
        {amount ? <Badge tone="primary">{amount}</Badge> : null}
      </div>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
        <div className="h-24 w-24 rounded-2xl border border-border bg-white bg-grid" />
        <div className="text-xs text-muted">
          {t(
            "qr.helper",
            "Scan the QR code with your wallet app. Use the button to confirm once you have paid."
          )}
        </div>
      </div>
      {note ? <p className="mt-3 text-xs text-muted">{note}</p> : null}
    </div>
  );
};

export default QrPanel;
