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
  formatCurrencyShort,
  formatRelativeTime,
  toTitle,
} from "../utils/format";

const AdminDashboard = () => {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [fundingVolume, setFundingVolume] = useState({
    total_amount: 0,
    change_pct: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveInvoice, setApproveInvoice] = useState(null);
  const [approveForm, setApproveForm] = useState({
    risk_tier: "A",
    apr_percent: "12",
  });
  const [approveError, setApproveError] = useState("");
  const [approveLoading, setApproveLoading] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const getErrorMessage = (err) =>
    err?.payload?.error?.message ||
    err?.message ||
    t("common.actionFailed", "Action failed");

  const openApproveModal = (invoice) => {
    if (!invoice?.id) {
      return;
    }
    setApproveInvoice(invoice);
    setApproveForm({
      risk_tier: invoice.risk || "A",
      apr_percent: invoice.apr ? invoice.apr.toString() : "12",
    });
    setApproveError("");
    setApproveOpen(true);
  };

  const closeApproveModal = () => {
    setApproveOpen(false);
    setApproveError("");
  };

  const handleApprove = async () => {
    if (!approveInvoice?.id) {
      return;
    }
    const riskTier = approveForm.risk_tier.trim().toUpperCase();
    const aprPercent = Number.parseFloat(approveForm.apr_percent);

    if (!riskTier) {
      setApproveError(
        t("admin.riskTierRequired", "Risk tier is required.")
      );
      return;
    }
    if (!Number.isFinite(aprPercent) || aprPercent <= 0) {
      setApproveError(t("admin.aprRequired", "APR percent must be greater than 0."));
      return;
    }

    setApproveLoading(true);
    setApproveError("");

    try {
      const token = await ensureRoleToken("admin");
      await apiRequest(`/admin/invoices/${approveInvoice.id}/approve`, {
        method: "POST",
        role: "admin",
        token,
        body: {
          risk_tier: riskTier,
          apr_percent: aprPercent,
        },
      });
      setApproveOpen(false);
      setRefreshKey((prev) => prev + 1);
      window.alert(t("admin.approved", "Invoice approved."));
    } catch (err) {
      setApproveError(getErrorMessage(err));
    } finally {
      setApproveLoading(false);
    }
  };

  const openPaymentModal = (request) => {
    if (!request?.id) {
      return;
    }
    if (!["FUNDED", "PARTIALLY_PAID"].includes(request.status)) {
      window.alert(
        t("admin.invoiceNotFunded", "Invoice is not funded yet.")
      );
      return;
    }
    setPaymentInvoice(request);
    setPaymentAmount(
      request.amount_value ? request.amount_value.toString() : ""
    );
    setPaymentError("");
    setPaymentOpen(true);
  };

  const closePaymentModal = () => {
    setPaymentOpen(false);
    setPaymentError("");
  };

  const handleMarkPaid = async () => {
    if (!paymentInvoice?.id) {
      return;
    }
    const amount = Number.parseFloat(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError(
        t("common.amountGreaterThanZero", "Amount must be greater than 0.")
      );
      return;
    }

    setPaymentLoading(true);
    setPaymentError("");

    try {
      const token = await ensureRoleToken("admin");
      await apiRequest(`/admin/invoices/${paymentInvoice.id}/mark-paid`, {
        method: "POST",
        role: "admin",
        token,
        body: { amount },
      });
      setPaymentOpen(false);
      setRefreshKey((prev) => prev + 1);
      window.alert(t("admin.paymentRecorded", "Payment recorded."));
    } catch (err) {
      setPaymentError(getErrorMessage(err));
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [metricsPayload, approvalsPayload, requestsPayload] =
          await Promise.all([
            apiRequest("/admin/dashboard/metrics", { role: "admin" }),
            apiRequest("/invoices?status=SUBMITTED&page=1&page_size=5", {
              role: "admin",
            }),
            apiRequest("/invoices?page=1&page_size=5", { role: "admin" }),
          ]);

        if (!active) {
          return;
        }

        const metrics = metricsPayload.data || {};
        const labelMap = {
          "Active SMEs": t("admin.stats.activeSmes", "Active SMEs"),
          "Funded invoices": t("admin.stats.fundedInvoices", "Funded invoices"),
          "Avg APR": t("admin.stats.avgApr", "Avg APR"),
          "At risk": t("admin.stats.atRisk", "At risk"),
        };
        setStats(
          (metrics.stats || []).map((stat) => ({
            ...stat,
            label: labelMap[stat.label] || stat.label,
          }))
        );
        setRiskDistribution(
          (metrics.risk_distribution || []).map((item) => ({
            label: t("admin.tierLabel", "Tier {tier}", { tier: item.tier }),
            value: item.ratio || 0,
          }))
        );
        setFundingVolume(
          metrics.funding_volume || { total_amount: 0, change_pct: 0 }
        );

        const approvalsData = approvalsPayload.data || [];
        setApprovals(
          approvalsData.map((invoice) => ({
            id: invoice.id,
            name: invoice.title,
            amount: formatCurrencyShort(invoice.amount),
            term: t("common.monthsShort", "{count} months", {
              count: invoice.term_months,
            }),
            risk: invoice.risk_tier || "-",
            apr: invoice.apr_percent || null,
            submitted: formatRelativeTime(invoice.created_at),
          }))
        );

        const requestsData = requestsPayload.data || [];
        setRequests(
          requestsData.map((invoice) => ({
            id: invoice.id,
            name: invoice.title,
            region: (invoice.tags && invoice.tags[0]) || invoice.currency || "-",
            amount: formatCurrencyShort(invoice.amount),
            amount_value: invoice.amount,
            status: invoice.status,
            statusLabel: toTitle(invoice.status),
            owner: invoice.issuer_id ? invoice.issuer_id.slice(0, 6) : "-",
          }))
        );
      } catch (err) {
        if (active) {
          setStats([]);
          setRiskDistribution([]);
          setApprovals([]);
          setRequests([]);
          setFundingVolume({ total_amount: 0, change_pct: 0 });
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [lang, t, refreshKey]);

  return (
    <DashboardShell
      navItems={[
        { id: "overview", label: t("admin.nav.overview", "Overview"), icon: "chart" },
        { id: "requests", label: t("admin.nav.requests", "Requests"), icon: "file" },
        { id: "risk", label: t("admin.nav.risk", "Risk Signals"), icon: "alert" },
        { id: "reports", label: t("admin.nav.reports", "Reports"), icon: "stack" },
        { id: "settings", label: t("admin.nav.settings", "Settings"), icon: "settings" },
      ]}
      activeId="overview"
      title={t("admin.title", "Admin command center")}
      subtitle={t("admin.subtitle", "Operations overview")}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("admin.fundingVolume", "Funding volume")}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink">
                {formatCurrencyShort(fundingVolume.total_amount || 0)}
              </p>
              <p className="text-xs text-muted">
                {t("admin.last30Days", "Last 30 days")}
              </p>
            </div>
            <Badge tone="success">
              +{(fundingVolume.change_pct || 0).toFixed(0)}%
            </Badge>
          </div>
          <div className="mt-6">
            <svg viewBox="0 0 400 140" className="h-40 w-full">
              <defs>
                <linearGradient id="adminVolume" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(59,130,246,0.4)" />
                  <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                </linearGradient>
              </defs>
              <path
                d="M0 110 C40 80 80 95 120 72 C160 50 200 85 240 60 C280 40 320 70 360 45 C380 30 400 35 400 35 L400 140 L0 140 Z"
                fill="url(#adminVolume)"
              />
              <path
                d="M0 110 C40 80 80 95 120 72 C160 50 200 85 240 60 C280 40 320 70 360 45 C380 30 400 35 400 35"
                fill="none"
                stroke="rgba(59,130,246,0.9)"
                strokeWidth="3"
              />
            </svg>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted">
            <span>{t("admin.week", "Week {count}", { count: 1 })}</span>
            <span>{t("admin.week", "Week {count}", { count: 2 })}</span>
            <span>{t("admin.week", "Week {count}", { count: 3 })}</span>
            <span>{t("admin.week", "Week {count}", { count: 4 })}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("admin.riskDistribution", "Risk distribution")}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink">
                {t("admin.portfolioMix", "Portfolio mix")}
              </p>
              <p className="text-xs text-muted">
                {t("admin.liveInvoices", "Live invoices by tier")}
              </p>
            </div>
            <Icon name="shield" className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-6 space-y-4">
            {riskDistribution.map((tier) => (
              <div key={tier.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{tier.label}</span>
                  <span className="text-muted">
                    {Math.round(tier.value * 100)}%
                  </span>
                </div>
                <ProgressBar value={tier.value} />
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
                {t("admin.approvalQueue", "Approval queue")}
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {t("admin.awaitingReview", "SMEs awaiting review")}
              </p>
            </div>
            <Button variant="ghost" size="sm">
              {t("admin.viewAll", "View all")}
            </Button>
          </div>
          <div className="mt-6 space-y-4">
            {approvals.map((item) => (
              <div
                key={item.id}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-slate-50 px-4 py-3 transition-colors duration-150 hover:border-slate-300"
                onClick={() => openApproveModal(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    openApproveModal(item);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.amount} - {item.term}
                  </p>
                </div>
                <div className="text-right">
                  <Badge tone="primary">
                    {t("admin.riskLabel", "Risk")} {item.risk}
                  </Badge>
                  <p className="mt-1 text-xs text-muted">{item.submitted}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("admin.recentRequests", "Recent requests")}
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {t("admin.livePipeline", "Live funding pipeline")}
              </p>
            </div>
            <Badge tone="success">{t("admin.healthy", "Healthy")}</Badge>
          </div>
          <div className="mt-6 space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex cursor-pointer items-center justify-between border-b border-border pb-3 text-sm transition-colors duration-150 hover:text-ink last:border-b-0 last:pb-0"
                onClick={() => openPaymentModal(request)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    openPaymentModal(request);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div>
                  <p className="font-semibold text-ink">{request.name}</p>
                  <p className="text-xs text-muted">
                    {request.region} - {t("common.owner", "Owner")}: {request.owner}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">{request.amount}</p>
                  <p className="text-xs text-muted">{request.statusLabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Modal
        open={approveOpen}
        title={t("admin.approveTitle", "Approve invoice")}
        subtitle={approveInvoice?.name || t("admin.approveSubtitle", "Review request")}
        onClose={closeApproveModal}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={closeApproveModal}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button size="sm" onClick={handleApprove} disabled={approveLoading}>
              {approveLoading
                ? t("common.processing", "Processing...")
                : t("admin.approveButton", "Approve")}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("admin.riskTierLabel", "Risk tier")}
            </label>
            <input
              type="text"
              value={approveForm.risk_tier}
              onChange={(event) =>
                setApproveForm((prev) => ({
                  ...prev,
                  risk_tier: event.target.value,
                }))
              }
              placeholder="A"
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("common.aprPercent", "APR %")}
            </label>
            <input
              type="number"
              min="0"
              value={approveForm.apr_percent}
              onChange={(event) =>
                setApproveForm((prev) => ({
                  ...prev,
                  apr_percent: event.target.value,
                }))
              }
              placeholder="12"
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        {approveError ? (
          <p className="mt-4 text-xs text-danger">{approveError}</p>
        ) : null}
      </Modal>

      <Modal
        open={paymentOpen}
        title={t("admin.markPaidTitle", "Mark invoice paid")}
        subtitle={paymentInvoice?.name || t("admin.markPaidSubtitle", "Settlement")}
        onClose={closePaymentModal}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={closePaymentModal}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button size="sm" onClick={handleMarkPaid} disabled={paymentLoading}>
              {paymentLoading
                ? t("common.processing", "Processing...")
                : t("common.ivePaid", "I've paid")}
            </Button>
          </>
        }
      >
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-muted">
            {t("admin.paymentAmount", "Payment amount")}
          </label>
          <input
            type="number"
            min="0"
            value={paymentAmount}
            onChange={(event) => setPaymentAmount(event.target.value)}
            placeholder="5000"
            className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {paymentError ? (
          <p className="mt-4 text-xs text-danger">{paymentError}</p>
        ) : null}
        <div className="mt-4">
          <QrPanel
            title={t("admin.settlementQr", "Settlement QR")}
            amount={formatCurrencyShort(Number(paymentAmount) || 0)}
            note={t(
              "admin.settlementNote",
              "Scan to simulate repayment settlement."
            )}
          />
        </div>
      </Modal>
    </DashboardShell>
  );
};

export default AdminDashboard;
