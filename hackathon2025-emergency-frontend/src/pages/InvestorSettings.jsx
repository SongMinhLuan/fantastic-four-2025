import { useEffect, useState } from "react";
import Button from "../components/Button";
import DashboardShell from "../components/DashboardShell";
import Icon from "../components/Icon";
import { apiRequest } from "../api/client";
import { useI18n } from "../i18n";
import { formatCurrencyShort, sumBy } from "../utils/format";

const InvestorSettings = () => {
  const { t, lang } = useI18n();
  const [balance, setBalance] = useState("-");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [mePayload, fundingsPayload] = await Promise.all([
          apiRequest("/auth/me", { role: "investor" }),
          apiRequest("/me/fundings?page=1&page_size=50", { role: "investor" }),
        ]);

        if (!active) {
          return;
        }

        const totalInvested = sumBy(
          fundingsPayload.data || [],
          (funding) => funding.amount
        );

        setBalance(formatCurrencyShort(totalInvested));
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
          id: "market",
          label: t("investor.nav.market", "Market"),
          icon: "market",
          href: "/investor/market",
        },
        {
          id: "portfolio",
          label: t("investor.nav.portfolio", "Portfolio"),
          icon: "portfolio",
          href: "/investor/portfolio",
        },
        {
          id: "account",
          label: t("investor.nav.account", "Account"),
          icon: "settings",
          href: "/investor/settings",
        },
      ]}
      title={t("investorSettings.title", "Account settings")}
      subtitle={t("investorSettings.subtitle", "Investor account")}
      searchId="investor-settings-search"
      searchPlaceholder={t("investorSettings.search", "Search settings")}
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
                {t("investorSettings.wallet", "Wallet")}
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {t("investorSettings.balance", "Funding balance")}
              </p>
            </div>
            <Icon name="wallet" className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-6 rounded-2xl border border-border bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("investorSettings.availableBalance", "Available balance")}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">
              {balance}
            </p>
            <p className="text-xs text-muted">
              {t("investorSettings.balanceNote", "Ready for new funding opportunities.")}
            </p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Icon name="arrow-down" className="h-4 w-4 text-success" />
                {t("investorSettings.depositFunds", "Deposit funds")}
              </div>
              <label
                htmlFor="investor-deposit"
                className="mt-3 block text-xs text-muted"
              >
                {t("common.amount", "Amount")}
              </label>
              <input
                id="investor-deposit"
                type="number"
                min="0"
                placeholder="5000"
                className="mt-2 h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button size="sm" className="mt-3 w-full">
                {t("common.deposit", "Deposit")}
              </Button>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Icon name="arrow-up" className="h-4 w-4 text-warning" />
                {t("investorSettings.withdrawFunds", "Withdraw funds")}
              </div>
              <label
                htmlFor="investor-withdraw"
                className="mt-3 block text-xs text-muted"
              >
                {t("common.amount", "Amount")}
              </label>
              <input
                id="investor-withdraw"
                type="number"
                min="0"
                placeholder="2500"
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
                {t("investorSettings.account", "Account")}
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {t("investorSettings.security", "Security and contact")}
              </p>
            </div>
            <Icon name="lock" className="h-6 w-6 text-warning" />
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Icon name="mail" className="h-4 w-4 text-primary" />
                {t("investorSettings.changeEmail", "Change email")}
              </div>
              <label
                htmlFor="investor-email"
                className="mt-3 block text-xs text-muted"
              >
                {t("investorSettings.newEmail", "New email")}
              </label>
              <input
                id="investor-email"
                type="email"
                autoComplete="email"
                defaultValue={email}
                placeholder="you@company.com"
                className="mt-2 h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button variant="outline" size="sm" className="mt-3">
                {t("investorSettings.updateEmail", "Update email")}
              </Button>
            </div>
            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Icon name="lock" className="h-4 w-4 text-warning" />
                {t("investorSettings.changePassword", "Change password")}
              </div>
              <div className="mt-3 grid gap-3">
                <div>
                  <label
                    htmlFor="investor-current-password"
                    className="block text-xs text-muted"
                  >
                    {t("investorSettings.currentPassword", "Current password")}
                  </label>
                  <input
                    id="investor-current-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder={t("investorSettings.currentPassword", "Enter current password")}
                    className="mt-2 h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label
                    htmlFor="investor-new-password"
                    className="block text-xs text-muted"
                  >
                    {t("investorSettings.newPassword", "New password")}
                  </label>
                  <input
                    id="investor-new-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("investorSettings.newPassword", "Create new password")}
                    className="mt-2 h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <Button size="sm" className="mt-3">
                {t("investorSettings.updatePassword", "Update password")}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
};

export default InvestorSettings;
