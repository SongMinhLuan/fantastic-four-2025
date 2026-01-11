import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import DashboardShell from "../components/DashboardShell";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import ProgressBar from "../components/ProgressBar";
import QrPanel from "../components/QrPanel";
import StatCard from "../components/StatCard";
import { apiRequest, ensureRoleToken } from "../api/client";
import { useI18n } from "../i18n";
import {
  addMonths,
  formatCurrencyShort,
  formatDate,
  formatPercent,
  sumBy,
  uniqueCount,
} from "../utils/format";

const InvestorDashboard = () => {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState([]);
  const [listings, setListings] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [marketSignals, setMarketSignals] = useState([]);
  const [emergencyCapital, setEmergencyCapital] = useState("-");
  const [refreshKey, setRefreshKey] = useState(0);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundTarget, setFundTarget] = useState(null);
  const [fundForm, setFundForm] = useState({
    amount: "",
    apr_percent: "",
    term_months: "",
  });
  const [fundError, setFundError] = useState("");
  const [fundLoading, setFundLoading] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("bank");
  const [depositError, setDepositError] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }
    const raw = window.localStorage.getItem("iflow_wallet_balance");
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  });

  const getErrorMessage = (err) =>
    err?.payload?.error?.message ||
    err?.message ||
    t("common.actionFailed", "Action failed");

  const openFundModal = (listing) => {
    if (!listing?.id) {
      return;
    }

    const remaining = Math.max(
      0,
      (listing.fundingTarget || 0) - (listing.fundedAmount || 0)
    );
    const suggestedAmount = remaining > 0 ? remaining : listing.amountValue || 0;

    setFundTarget(listing);
    setFundForm({
      amount: suggestedAmount ? suggestedAmount.toString() : "",
      apr_percent: listing.aprPercent ? listing.aprPercent.toString() : "12",
      term_months: listing.termMonths ? listing.termMonths.toString() : "3",
    });
    setFundError("");
    setFundModalOpen(true);
  };

  const openDepositModal = () => {
    setDepositAmount("");
    setDepositMethod("bank");
    setDepositError("");
    setDepositOpen(true);
  };

  const closeDepositModal = () => {
    setDepositOpen(false);
    setDepositError("");
  };

  const closeFundModal = () => {
    setFundModalOpen(false);
    setFundError("");
  };

  const handleFundPaid = async () => {
    if (!fundTarget?.id) {
      return;
    }

    const amount = Number.parseFloat(fundForm.amount);
    const aprPercent = Number.parseFloat(fundForm.apr_percent);
    const termMonths = Number.parseInt(fundForm.term_months, 10);

    if (!Number.isFinite(amount) || amount <= 0) {
      setFundError(t("investor.fundAmountError", "Amount must be greater than 0."));
      return;
    }
    if (!Number.isFinite(aprPercent) || aprPercent <= 0) {
      setFundError(t("investor.aprError", "APR percent must be greater than 0."));
      return;
    }
    if (!Number.isFinite(termMonths) || termMonths <= 0) {
      setFundError(t("investor.termError", "Term must be greater than 0."));
      return;
    }

    setFundLoading(true);
    setFundError("");

    try {
      const token = await ensureRoleToken("investor");
      await apiRequest(`/invoices/${fundTarget.id}/fund`, {
        method: "POST",
        role: "investor",
        token,
        body: {
          amount,
          apr_percent: aprPercent,
          term_months: termMonths,
        },
      });
      setFundModalOpen(false);
      setRefreshKey((prev) => prev + 1);
      window.alert(t("investor.fundingSubmitted", "Funding submitted."));
    } catch (err) {
      setFundError(getErrorMessage(err));
    } finally {
      setFundLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amount = Number.parseFloat(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setDepositError(
        t("common.amountGreaterThanZero", "Amount must be greater than 0.")
      );
      return;
    }

    setDepositLoading(true);
    setDepositError("");

    try {
      const nextBalance = walletBalance + amount;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "iflow_wallet_balance",
          nextBalance.toString()
        );
      }
      setWalletBalance(nextBalance);
      setDepositOpen(false);
      window.alert(t("investor.depositSuccess", "Deposit recorded."));
    } finally {
      setDepositLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleStorage = (event) => {
      if (event.key === "iflow_wallet_balance") {
        const raw = window.localStorage.getItem("iflow_wallet_balance");
        const parsed = Number.parseFloat(raw);
        setWalletBalance(Number.isFinite(parsed) ? parsed : 0);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [invoicePayload, fundingsPayload] = await Promise.all([
          apiRequest("/invoices?status=APPROVED&page=1&page_size=20", {
            role: "investor",
          }),
          apiRequest("/me/fundings?page=1&page_size=10", { role: "investor" }),
        ]);

        if (!active) {
          return;
        }

        const invoices = invoicePayload.data || [];
        const fundings = fundingsPayload.data || [];

        const invoiceMap = new Map(
          invoices.map((invoice) => [invoice.id, invoice])
        );

        const totalInvested = sumBy(fundings, (funding) => funding.amount);
        const avgApr = fundings.length
          ? sumBy(fundings, (funding) => funding.apr_percent) / fundings.length
          : 0;
        const activeDeals = fundings.length;
        const impactScore = Math.min(
          100,
          uniqueCount(invoices, (invoice) => invoice.issuer_id) * 10
        );

        setStats([
          {
            label: t("investor.stats.availableCapital", "Available capital"),
            value: formatCurrencyShort(walletBalance),
            delta: t("investor.stats.invested", "Invested {amount}", {
              amount: formatCurrencyShort(totalInvested),
            }),
            icon: "wallet",
            tone: "primary",
          },
          {
            label: t("investor.stats.activeDeals", "Active deals"),
            value: activeDeals.toString(),
            delta: t("investor.stats.livePositions", "Live positions"),
            icon: "briefcase",
            tone: "secondary",
          },
          {
            label: t("investor.stats.expectedYield", "Expected yield"),
            value: formatPercent(avgApr),
            delta: t("investor.stats.net", "Net"),
            icon: "trend",
            tone: "success",
          },
          {
            label: t("investor.stats.impactScore", "Impact score"),
            value: impactScore ? impactScore.toString() : "-",
            delta: t("investor.stats.basedOnSmes", "Based on active SMEs"),
            icon: "spark",
            tone: "warning",
          },
        ]);

        setListings(
          invoices.map((invoice) => ({
            id: invoice.id,
            name: invoice.title,
            industry:
              (invoice.tags && invoice.tags[0]) || t("common.general", "General"),
            location: invoice.currency || "-",
            amount: formatCurrencyShort(invoice.amount),
            amountValue: invoice.amount,
            term: t("common.monthsShort", "{count} months", {
              count: invoice.term_months,
            }),
            termMonths: invoice.term_months,
            returnRate: formatPercent(invoice.apr_percent || 0),
            aprPercent: invoice.apr_percent || 0,
            risk: invoice.risk_tier || "-",
            progress: invoice.funding_target
              ? invoice.funded_amount / invoice.funding_target
              : 0,
            fundingTarget: invoice.funding_target,
            fundedAmount: invoice.funded_amount,
            tags:
              invoice.tags && invoice.tags.length
                ? invoice.tags
                : [t("home.hero.badge", "Invoice-backed")],
          }))
        );

        setPortfolio(
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

        const tagCounts = {};
        invoices.forEach((invoice) => {
          (invoice.tags || []).forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });

        const sortedTags = Object.keys(tagCounts).sort(
          (a, b) => tagCounts[b] - tagCounts[a]
        );

        setMarketSignals(
          sortedTags.slice(0, 3).map((tag, index) => ({
            sector: tag,
            level:
              index === 0
                ? t("status.high", "High")
                : index === 1
                ? t("status.medium", "Medium")
                : t("status.low", "Low"),
          }))
        );

        const emergencyTotal = sumBy(
          invoices.filter((invoice) => invoice.emergency_lane),
          (invoice) => invoice.funding_target - invoice.funded_amount
        );
        setEmergencyCapital(formatCurrencyShort(emergencyTotal));
      } catch (err) {
        if (active) {
          setStats([]);
          setListings([]);
          setPortfolio([]);
          setMarketSignals([]);
          setEmergencyCapital("-");
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [lang, refreshKey, t, walletBalance]);

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
      activeId="market"
      title={t("investor.title", "Investor marketplace")}
      subtitle={t("investor.subtitle", "Investor view")}
      searchId="investor-search"
      searchPlaceholder={t("investor.search", "Search SMEs, invoices, sectors")}
      actions={
        <Button size="sm" onClick={openDepositModal}>
          {t("investor.addFunds", "Add funds")}
        </Button>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("investor.availableSmes", "Available SMEs")}
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {t("investor.openOpportunities", "Open invoice opportunities")}
              </p>
            </div>
            <Badge tone="primary">
              {t("investor.liveDeals", "{count} live deals", {
                count: listings.length,
              })}
            </Badge>
          </div>
          <div className="grid gap-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="cursor-pointer rounded-3xl border border-border bg-white p-5 shadow-card transition-colors duration-200 hover:border-slate-300"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-ink">
                        {listing.name}
                      </h3>
                      <Badge tone="primary">
                        {t("admin.riskLabel", "Risk")} {listing.risk}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {listing.industry} - {listing.location}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {listing.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border px-2 py-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <Icon name="coins" className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-ink">
                        {listing.amount}
                      </span>
                      <span className="text-muted">- {listing.term}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Icon name="trend" className="h-4 w-4 text-success" />
                      <span className="font-semibold text-ink">
                        {listing.returnRate}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="text-xs text-muted">
                      {t("investor.fundedPercent", "Funded {percent}%", {
                        percent: Math.round(listing.progress * 100),
                      })}
                    </div>
                    <ProgressBar value={listing.progress} />
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        {t("common.review", "Review")}
                      </Button>
                      <Button size="sm" onClick={() => openFundModal(listing)}>
                        {t("common.fundNow", "Fund now")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  {t("investor.portfolioFocus", "Portfolio focus")}
                </p>
                <p className="mt-2 font-display text-lg font-semibold text-ink">
                  {t("investor.activeInvestments", "Active investments")}
                </p>
              </div>
              <Icon name="portfolio" className="h-6 w-6 text-primary" />
            </div>
            <div className="mt-4 space-y-4 text-sm">
              {portfolio.map((item) => (
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
                  {t("investor.marketSignal", "Market signal")}
                </p>
                <p className="mt-2 font-display text-lg font-semibold text-ink">
                  {t("investor.demandHeatmap", "Demand heatmap")}
                </p>
              </div>
              <Badge tone="success">{t("investor.rising", "Rising")}</Badge>
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted">
              {marketSignals.map((signal) => (
                <div
                  key={signal.sector}
                  className="flex items-center justify-between"
                >
                  <span>{signal.sector}</span>
                  <span className="font-semibold text-ink">{signal.level}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-muted">
              {t("investor.emergencyCapital", "Capital waiting for emergency lane: {amount}", {
                amount: emergencyCapital,
              })}
            </div>
          </div>
        </div>
      </section>

      <Modal
        open={fundModalOpen}
        title={t("investor.fundModalTitle", "Fund invoice")}
        subtitle={fundTarget?.name || t("investor.fundModalSubtitle", "Funding")}
        onClose={closeFundModal}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={closeFundModal}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button size="sm" onClick={handleFundPaid} disabled={fundLoading}>
              {fundLoading
                ? t("common.processing", "Processing...")
                : t("common.ivePaid", "I've paid")}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("common.amount", "Amount")}
            </label>
            <input
              type="number"
              min="0"
              value={fundForm.amount}
              onChange={(event) =>
                setFundForm((prev) => ({ ...prev, amount: event.target.value }))
              }
              placeholder="5000"
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("common.aprPercent", "APR %")}
            </label>
            <input
              type="number"
              min="0"
              value={fundForm.apr_percent}
              onChange={(event) =>
                setFundForm((prev) => ({
                  ...prev,
                  apr_percent: event.target.value,
                }))
              }
              placeholder="12"
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("common.termMonths", "Term months")}
            </label>
            <input
              type="number"
              min="1"
              value={fundForm.term_months}
              onChange={(event) =>
                setFundForm((prev) => ({
                  ...prev,
                  term_months: event.target.value,
                }))
              }
              placeholder="3"
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        {fundError ? <p className="mt-4 text-xs text-danger">{fundError}</p> : null}
        <div className="mt-4">
          <QrPanel
            title={t("investor.fundingQr", "Funding QR")}
            amount={formatCurrencyShort(Number(fundForm.amount) || 0)}
            note={t(
              "investor.fundingQrNote",
              "Scan to simulate sending funds to escrow."
            )}
          />
        </div>
      </Modal>

      <Modal
        open={depositOpen}
        title={t("investor.depositTitle", "Deposit funds")}
        subtitle={t("investor.depositSubtitle", "Top up your wallet")}
        onClose={closeDepositModal}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={closeDepositModal}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button size="sm" onClick={handleDeposit} disabled={depositLoading}>
              {depositLoading
                ? t("common.processing", "Processing...")
                : t("investor.depositConfirm", "Confirm deposit")}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("investor.depositAmount", "Deposit amount")}
            </label>
            <input
              type="number"
              min="0"
              value={depositAmount}
              onChange={(event) => setDepositAmount(event.target.value)}
              placeholder="5000"
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("investor.depositMethod", "Method")}
            </label>
            <select
              value={depositMethod}
              onChange={(event) => setDepositMethod(event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="bank">
                {t("investor.depositMethodBank", "Bank transfer")}
              </option>
              <option value="wallet">
                {t("investor.depositMethodWallet", "E-wallet")}
              </option>
            </select>
          </div>
        </div>
        {depositError ? (
          <p className="mt-4 text-xs text-danger">{depositError}</p>
        ) : null}
        <div className="mt-4">
          <QrPanel
            title={t("investor.depositQr", "Deposit QR")}
            amount={formatCurrencyShort(Number(depositAmount) || 0)}
            note={t(
              "investor.depositQrNote",
              "Scan to simulate topping up your wallet."
            )}
          />
        </div>
      </Modal>
    </DashboardShell>
  );
};

export default InvestorDashboard;
