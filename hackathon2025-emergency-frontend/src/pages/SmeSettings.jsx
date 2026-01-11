import { useEffect, useState } from "react";
import Button from "../components/Button";
import DashboardShell from "../components/DashboardShell";
import Icon from "../components/Icon";
import { apiRequest } from "../api/client";
import { useI18n } from "../i18n";
import { formatCurrencyShort, sumBy } from "../utils/format";

const SmeSettings = () => {
  const { t, lang } = useI18n();
  const [balance, setBalance] = useState("-");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [mePayload, invoicesPayload] = await Promise.all([
          apiRequest("/auth/me", { role: "sme" }),
          apiRequest("/invoices?page=1&page_size=50", { role: "sme" }),
        ]);

        if (!active) {
          return;
        }

        const invoices = invoicesPayload.data || [];
        const payable = sumBy(
          invoices.filter((invoice) =>
            ["FUNDED", "PARTIALLY_PAID"].includes(invoice.status)
          ),
          (invoice) => invoice.funded_amount
        );

        setBalance(formatCurrencyShort(payable));
        setEmail(mePayload.data?.email || "");
      } catch (err) {
        if (active) {
          setBalance("-");
          setEmail("");
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [lang]);

  return (
    <DashboardShell
      navItems={[
        {
          id: "marketplace",
          label: t("sme.nav.marketplace", "Marketplace"),
          icon: "market",
          href: "/sme/marketplace",
        },
        {
          id: "portfolio",
          label: t("sme.nav.portfolio", "Portfolio"),
          icon: "portfolio",
          href: "/sme/portfolio",
        },
        {
          id: "settings",
          label: t("sme.nav.settings", "Settings"),
          icon: "settings",
          href: "/sme/settings",
        },
      ]}
      title={t("smeSettings.title", "Account settings")}
      subtitle={t("smeSettings.subtitle", "SME account")}
      searchId="sme-settings-search"
      searchPlaceholder={t("smeSettings.search", "Search settings")}
      actions={
        <Button variant="outline" size="sm">
          {t("common.support", "Support")}
        </Button>
      }
    >
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("smeSettings.payouts", "Payouts")}
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {t("smeSettings.withdrawalBalance", "Withdrawal balance")}
              </p>
            </div>
            <Icon name="wallet" className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-6 rounded-2xl border border-border bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("smeSettings.availableToWithdraw", "Available to withdraw")}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">
              {balance}
            </p>
            <p className="text-xs text-muted">
              {t("smeSettings.afterEscrow", "After escrow clearance.")}
            </p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Icon name="arrow-down" className="h-4 w-4 text-success" />
                {t("common.deposit", "Deposit funds")}
              </div>
              <label
                htmlFor="sme-deposit"
                className="mt-3 block text-xs text-muted"
              >
                {t("common.amount", "Amount")}
              </label>
              <input
                id="sme-deposit"
                type="number"
                min="0"
                placeholder="3000"
                className="mt-2 h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button size="sm" className="mt-3 w-full">
                {t("common.deposit", "Deposit")}
              </Button>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Icon name="arrow-up" className="h-4 w-4 text-warning" />
                {t("common.withdraw", "Withdraw funds")}
              </div>
              <label
                htmlFor="sme-withdraw"
                className="mt-3 block text-xs text-muted"
              >
                {t("common.amount", "Amount")}
              </label>
              <input
                id="sme-withdraw"
                type="number"
                min="0"
                placeholder="1500"
                className="mt-2 h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button variant="outline" size="sm" className="mt-3 w-full">
                {t("common.withdraw", "Withdraw")}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("smeSettings.account", "Account")}
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {t("smeSettings.security", "Security and contact")}
              </p>
            </div>
            <Icon name="lock" className="h-6 w-6 text-warning" />
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Icon name="mail" className="h-4 w-4 text-primary" />
                {t("smeSettings.changeEmail", "Change email")}
              </div>
              <label
                htmlFor="sme-email"
                className="mt-3 block text-xs text-muted"
              >
                {t("smeSettings.newEmail", "New email")}
              </label>
              <input
                id="sme-email"
                type="email"
                autoComplete="email"
                defaultValue={email}
                placeholder="finance@company.com"
                className="mt-2 h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button variant="outline" size="sm" className="mt-3">
                {t("smeSettings.updateEmail", "Update email")}
              </Button>
            </div>
            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Icon name="lock" className="h-4 w-4 text-warning" />
                {t("smeSettings.changePassword", "Change password")}
              </div>
              <div className="mt-3 grid gap-3">
                <div>
                  <label
                    htmlFor="sme-current-password"
                    className="block text-xs text-muted"
                  >
                    {t("smeSettings.currentPassword", "Current password")}
                  </label>
                  <input
                    id="sme-current-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder={t("smeSettings.currentPassword", "Enter current password")}
                    className="mt-2 h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label
                    htmlFor="sme-new-password"
                    className="block text-xs text-muted"
                  >
                    {t("smeSettings.newPassword", "New password")}
                  </label>
                  <input
                    id="sme-new-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("smeSettings.newPassword", "Create new password")}
                    className="mt-2 h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <Button size="sm" className="mt-3">
                {t("smeSettings.updatePassword", "Update password")}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
};

export default SmeSettings;
