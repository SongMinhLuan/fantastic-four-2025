import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import DashboardShell from "../components/DashboardShell";
import Icon from "../components/Icon";
import ProgressBar from "../components/ProgressBar";
import StatCard from "../components/StatCard";
import { apiRequest } from "../api/client";
import { useI18n } from "../i18n";
import {
  addMonths,
  formatCurrencyShort,
  formatDate,
  formatPercent,
  sumBy,
} from "../utils/format";

const InvestorPortfolio = () => {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState([]);
  const [allocation, setAllocation] = useState([]);
  const [positions, setPositions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [progress, setProgress] = useState({
    invested: 0,
    returned: 0,
    ratio: 0,
    nextPayoutAmount: 0,
    nextPayoutDate: "-",
    riskReserve: 0,
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [fundingsPayload, invoicePayload] = await Promise.all([
          apiRequest("/me/fundings?page=1&page_size=50", { role: "investor" }),
          apiRequest("/invoices?status=APPROVED&page=1&page_size=50", {
            role: "investor",
          }),
        ]);

        if (!active) {
          return;
        }

        const fundings = fundingsPayload.data || [];
        const invoices = invoicePayload.data || [];
        const invoiceMap = new Map(
          invoices.map((invoice) => [invoice.id, invoice])
        );

        const totalInvested = sumBy(fundings, (funding) => funding.amount);
        const totalReturned = 0;
        const pendingPayout = sumBy(
          fundings.filter((funding) => funding.status === "PENDING"),
          (funding) => funding.amount
        );

        const payoutDates = fundings
          .map((funding) => {
            const invoice = invoiceMap.get(funding.invoice_id);
            const baseDate = invoice?.due_date || funding.created_at;
            const date = addMonths(baseDate, funding.term_months);
            return date;
          })
          .filter(Boolean)
          .sort((a, b) => a - b);

        const nextPayoutDate = payoutDates.length
          ? formatDate(payoutDates[0])
          : "-";

        setProgress({
          invested: totalInvested,
          returned: totalReturned,
          ratio: totalInvested ? totalReturned / totalInvested : 0,
          nextPayoutAmount: pendingPayout,
          nextPayoutDate,
          riskReserve: 0,
        });

        setStats([
          {
            label: t("portfolio.totalInvested", "Total invested"),
            value: formatCurrencyShort(totalInvested),
            delta: t("portfolio.acrossPositions", "Across positions"),
            icon: "wallet",
            tone: "primary",
          },
          {
            label: t("portfolio.totalReturned", "Total returned"),
            value: formatCurrencyShort(totalReturned),
            delta: t("portfolio.paidOut", "Paid out"),
            icon: "coins",
            tone: "success",
          },
          {
            label: t("portfolio.pendingPayout", "Pending payout"),
            value: formatCurrencyShort(pendingPayout),
            delta: t("portfolio.next30Days", "Next 30 days"),
            icon: "clock",
            tone: "warning",
          },
        ]);

        setPositions(
          fundings.map((funding) => {
            const invoice = invoiceMap.get(funding.invoice_id);
            const baseDate = invoice?.due_date || funding.created_at;
            const payoutDate = addMonths(baseDate, funding.term_months);
            return {
              name:
                invoice?.title ||
                `${t("common.invoice", "Invoice")} ${funding.invoice_id.slice(0, 6)}`,
              amount: formatCurrencyShort(funding.amount),
              returnRate: formatPercent(funding.apr_percent),
              status:
                funding.status === "CONFIRMED"
                  ? t("common.onTrack", "On track")
                  : t("common.review", "Review"),
              nextPayout: payoutDate ? formatDate(payoutDate) : "-",
            };
          })
        );

        setPayouts(
          fundings.map((funding) => {
            const invoice = invoiceMap.get(funding.invoice_id);
            const baseDate = invoice?.due_date || funding.created_at;
            const payoutDate = addMonths(baseDate, funding.term_months);
            return {
              name:
                invoice?.title ||
                `${t("common.invoice", "Invoice")} ${funding.invoice_id.slice(0, 6)}`,
              status:
                funding.status === "CONFIRMED"
                  ? t("common.onTrack", "On track")
                  : t("common.review", "Review"),
              nextPayout: payoutDate ? formatDate(payoutDate) : "-",
            };
          })
        );

        const sectorTotals = {};
        fundings.forEach((funding) => {
          const invoice = invoiceMap.get(funding.invoice_id);
          const sector =
            (invoice?.tags && invoice.tags[0]) || t("common.general", "General");
          sectorTotals[sector] = (sectorTotals[sector] || 0) + funding.amount;
        });

        const totalAllocation = sumBy(
          Object.keys(sectorTotals),
          (sector) => sectorTotals[sector]
        );

        setAllocation(
          Object.entries(sectorTotals).map(([sector, amount]) => ({
            label: sector,
            value: totalAllocation ? amount / totalAllocation : 0,
            amount: formatCurrencyShort(amount),
          }))
        );
      } catch (err) {
        if (active) {
          setStats([]);
          setAllocation([]);
          setPositions([]);
          setPayouts([]);
          setProgress({
            invested: 0,
            returned: 0,
            ratio: 0,
            nextPayoutAmount: 0,
            nextPayoutDate: "-",
            riskReserve: 0,
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
      title={t("portfolio.title", "Portfolio analytics")}
      subtitle={t("portfolio.subtitle", "Investor portfolio")}
      searchId="investor-portfolio-search"
      searchPlaceholder={t("portfolio.search", "Search portfolio, SMEs")}
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
                {t("portfolio.returnProgress", "Return progress")}
              </p>
              <p className="mt-2 font-display text-lg font-semibold text-ink">
                {t("portfolio.paidOutVsInvested", "Paid out vs invested")}
              </p>
            </div>
            <Badge tone="primary">
              {Math.round(progress.ratio * 100)}% {t("portfolio.paidOut", "paid")}
            </Badge>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink">
                {formatCurrencyShort(progress.returned)} {t("portfolio.returnedLabel", "returned")}
              </span>
              <span className="text-muted">
                {formatCurrencyShort(progress.invested)} {t("portfolio.investedLabel", "invested")}
              </span>
            </div>
            <ProgressBar value={progress.ratio} />
            <p className="text-xs text-muted">
              {t("portfolio.returnsNote", "Returns update after each payout cycle.")}
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("portfolio.nextPayout", "Next payout")}
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {formatCurrencyShort(progress.nextPayoutAmount)}
              </p>
              <p className="text-xs text-muted">
                {t("portfolio.scheduled", "Scheduled {date}", {
                  date: progress.nextPayoutDate,
                })}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("portfolio.riskReserve", "Risk reserve")}
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {formatCurrencyShort(progress.riskReserve)}
              </p>
              <p className="text-xs text-muted">
                {t("portfolio.heldInEscrow", "Held in escrow")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("portfolio.allocation", "Allocation")}
              </p>
              <p className="mt-2 font-display text-lg font-semibold text-ink">
                {t("portfolio.sectorSplit", "Sector split")}
              </p>
            </div>
            <Icon name="stack" className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-6 space-y-4">
            {allocation.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{item.label}</span>
                  <span className="text-muted">{item.amount}</span>
                </div>
                <ProgressBar value={item.value} />
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
                {t("investor.activeInvestments", "Active investments")}
              </p>
              <p className="mt-2 font-display text-lg font-semibold text-ink">
                {t("portfolio.positions", "Portfolio positions")}
              </p>
            </div>
            <Badge tone="success">{t("common.onTrack", "On track")}</Badge>
          </div>
          <div className="mt-6 space-y-4 text-sm">
            {positions.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-border bg-slate-50 px-4 py-3"
              >
                <p className="font-semibold text-ink">{item.name}</p>
                <p className="text-xs text-muted">
                  {item.amount} - {item.returnRate}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted">
                  <span>{item.status}</span>
                  <span>
                    {t("common.nextPayout", "Next payout")} {item.nextPayout}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("portfolio.payoutCadence", "Payout cadence")}
              </p>
              <p className="mt-2 font-display text-lg font-semibold text-ink">
                {t("portfolio.upcomingCashflow", "Upcoming cashflow")}
              </p>
            </div>
            <Icon name="clock" className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-6 space-y-4 text-sm">
            {payouts.map((item) => (
              <div
                key={`${item.name}-payout`}
                className="flex items-center justify-between rounded-2xl border border-border bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-ink">{item.name}</p>
                  <p className="text-xs text-muted">{item.status}</p>
                </div>
                <div className="text-right text-xs text-muted">
                  <p className="font-semibold text-ink">{item.nextPayout}</p>
                  <p>{t("portfolio.estimatedPayout", "Estimated payout")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
};

export default InvestorPortfolio;
