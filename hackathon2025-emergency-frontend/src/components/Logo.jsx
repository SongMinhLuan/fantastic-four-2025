import { useI18n } from "../i18n";
import Icon from "./Icon";

const Logo = () => {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
        <Icon name="spark" className="h-5 w-5" />
      </div>
      <div>
        <p className="font-display text-lg font-semibold text-ink">
          InvoiceFlow
        </p>
        <p className="text-xs text-muted">
          {t("logo.tagline", "SME & Investor bridge")}
        </p>
      </div>
    </div>
  );
};

export default Logo;
