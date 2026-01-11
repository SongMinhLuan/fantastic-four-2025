import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import DashboardShell from "../components/DashboardShell";
import Icon from "../components/Icon";
import ProgressBar from "../components/ProgressBar";
import StatCard from "../components/StatCard";
import { apiRequest } from "../api/client";
import { useI18n } from "../i18n";
import {
  formatCurrencyShort,
  formatDate,
  formatPercent,
  sumBy,
  toTitle,
} from "../utils/format";

const SmePortfolio = () => {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [summary, setSummary] = useState({
    received: 0,
    target: 0,
    ratio: 0,
    avgApr: 0,
    activeInvestors: 0,
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const payload = await apiRequest("/invoices?page=1&page_size=50", {
          role: "sme",
        });
        const invoices = payload.data || [];

        if (!active) {
          return;
        }

        const received = sumBy(invoices, (invoice) => invoice.funded_amount);
        const target = sumBy(invoices, (invoice) => invoice.funding_target);
        const ratio = target ? received / target : 0;
        const aprValues = invoices
          .map((invoice) => invoice.apr_percent)
          .filter((value) => typeof value === "number" && value > 0);
        const avgApr = aprValues.length
          ? aprValues.reduce((sum, value) => sum + value, 0) / aprValues.length
          : 0;

        const receiptsData = invoices.map((invoice) => ({
          label: invoice.title,
          amount: formatCurrencyShort(invoice.funded_amount),
          amount_value: invoice.funded_amount,
          eta: formatDate(invoice.due_date),
        }));

        setSummary({
          received,
          target,
          ratio,
          avgApr,
          activeInvestors: invoices.length,
        });

        setStats([
          {
            label: t("smePortfolio.totalReceived", "Total received"),
            value: formatCurrencyShort(received),
            delta: t("smePortfolio.ytd", "YTD"),
            icon: "coins",
            tone: "success",
          },
          {
            label: t("smePortfolio.outstanding", "Outstanding"),
            value: formatCurrencyShort(Math.max(target - received, 0)),
            delta: t("smePortfolio.acrossInvoices", "Across {count} invoices", {
              count: invoices.length,
            }),
            icon: "file",
            tone: "warning",
          },
          {
            label: t("smePortfolio.nextPayout", "Next payout"),
            value: formatCurrencyShort(receiptsData[0]?.amount_value || 0),
            delta: receiptsData[0]?.eta
              ? t("smePortfolio.dueDate", "Due {date}", {
                  date: receiptsData[0].eta,
                })
              : "-",
            icon: "clock",
            tone: "primary",
          },
        ]);

        setReceipts(receiptsData);

        setPortfolio(
          invoices.map((invoice) => ({
            invoice: invoice.title,
            amount: formatCurrencyShort(invoice.amount),
            status: toTitle(invoice.status),
            due: formatDate(invoice.due_date),
          }))
        );
      } catch (err) {
        if (active) {
          setStats([]);
          setReceipts([]);
          setPortfolio([]);
          setSummary({
            received: 0,
            target: 0,
            ratio: 0,
            avgApr: 0,
            activeInvestors: 0,
          });
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [lang, t]);

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
      title={t("smePortfolio.title", "Portfolio overview")}
      subtitle={t("smePortfolio.subtitle", "SME portfolio")}
      searchId="sme-portfolio-search"
      searchPlaceholder={t("smePortfolio.search", "Search invoices, payouts")}
      actions={
        <Button variant="outline" size="sm">
          {t("common.export", "Export")}
        </Button>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("smePortfolio.disbursementProgress", "Disbursement progress")}
              </p>
              <p className="mt-2 font-display text-lg font-semibold text-ink">
                {t("smePortfolio.receivedVsTarget", "Received vs target")}
              </p>
            </div>
            <Badge tone="primary">
              {t("sme.completePercent", "{percent}% complete", {
                percent: Math.round(summary.ratio * 100),
              })}
            </Badge>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink">
                {formatCurrencyShort(summary.received)} {t("smePortfolio.receivedLabel", "received")}
              </span>
              <span className="text-muted">
                {formatCurrencyShort(summary.target)} {t("smePortfolio.targetLabel", "target")}
              </span>
            </div>
            <ProgressBar value={summary.ratio} />
            <p className="text-xs text-muted">
              {t(
                "smePortfolio.fundingUpdates",
                "Funding updates when invoices are fully verified."
              )}
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("smePortfolio.averageApr", "Average APR")}
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {formatPercent(summary.avgApr)}
              </p>
              <p className="text-xs text-muted">
                {t("smePortfolio.invoiceMix", "Current invoice mix")}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("smePortfolio.activeInvestors", "Active investors")}
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {summary.activeInvestors}
              </p>
              <p className="text-xs text-muted">
                {t("smePortfolio.acrossInvoicesShort", "Across invoices")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("smePortfolio.upcomingReceipts", "Upcoming receipts")}
              </p>
              <p className="mt-2 font-display text-lg font-semibold text-ink">
                {t("smePortfolio.payoutSchedule", "Payout schedule")}
              </p>
            </div>
            <Icon name="clock" className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-6 space-y-4 text-sm">
            {receipts.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border bg-slate-50 px-4 py-3"
              >
                <p className="font-semibold text-ink">{item.label}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted">
                  <span>{item.amount}</span>
                  <span>{t("smePortfolio.dueDate", "Due {date}", { date: item.eta })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("sme.activeInvoices", "Active invoices")}
              </p>
              <p className="mt-2 font-display text-lg font-semibold text-ink">
                {t("smePortfolio.pipeline", "Portfolio pipeline")}
              </p>
            </div>
            <Badge tone="success">{t("common.onTrack", "On track")}</Badge>
          </div>
          <div className="mt-6 space-y-4 text-sm">
            {portfolio.map((item) => (
              <div
                key={item.invoice}
                className="flex items-center justify-between border-b border-border pb-3 last:border-b-0 last:pb-0"
              >
                <div>
                  <p className="font-semibold text-ink">{item.invoice}</p>
                  <p className="text-xs text-muted">
                    {t("smePortfolio.dueDate", "Due {date}", { date: item.due })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">{item.amount}</p>
                  <p className="text-xs text-muted">{item.status}</p>
                </div>
              </div>
            ))}
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-muted">
              {t("sme.nextRepayment", "Next repayment scheduled in 12 days.")}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("smePortfolio.cashflowActions", "Cashflow actions")}
              </p>
              <p className="mt-2 font-display text-lg font-semibold text-ink">
                {t("smePortfolio.shareUpdates", "Share updates")}
              </p>
            </div>
            <Icon name="handshake" className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-6 space-y-4 text-sm text-muted">
            <p>
              {t(
                "smePortfolio.keepInvestors",
                "Keep investors confident with fresh updates on delivery, invoice status, and repayment timing."
              )}
            </p>
            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("smePortfolio.nextUpdate", "Next update")}
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {t("smePortfolio.shipment", "Shipment confirmation - {eta}", {
                  eta: receipts[0]?.eta || "-",
                })}
              </p>
            </div>
            <Button size="sm">
              {t("smePortfolio.sendUpdate", "Send portfolio update")}
            </Button>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
};

export default SmePortfolio;
