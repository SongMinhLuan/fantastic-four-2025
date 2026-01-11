import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import DashboardShell from "../components/DashboardShell";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import ProgressBar from "../components/ProgressBar";
import StatCard from "../components/StatCard";
import { apiRequest, ensureRoleToken } from "../api/client";
import { useI18n } from "../i18n";
import {
  formatCurrencyShort,
  formatDate,
  formatPercent,
  sumBy,
  toTitle,
} from "../utils/format";

const getDefaultInvoiceForm = () => {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 45);
  return {
    title: "",
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    amount: "",
    currency: "USD",
    term_months: 3,
    apr_percent: "12",
    due_date: dueDate.toISOString().slice(0, 10),
    funding_target: "",
    emergency_lane: false,
    tags: "Retail",
  };
};

const SmeDashboard = () => {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [offers, setOffers] = useState([]);
  const [hangingFunds, setHangingFunds] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceModalSubmit, setInvoiceModalSubmit] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(getDefaultInvoiceForm);
  const [invoiceError, setInvoiceError] = useState("");
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const getErrorMessage = (err) =>
    err?.payload?.error?.message ||
    err?.message ||
    t("common.actionFailed", "Action failed");

  const openInvoiceModal = (submitAfter) => {
    setInvoiceModalSubmit(submitAfter);
    setInvoiceForm(getDefaultInvoiceForm());
    setInvoiceError("");
    setInvoiceModalOpen(true);
  };

  const closeInvoiceModal = () => {
    setInvoiceModalOpen(false);
    setInvoiceError("");
  };

  const handleInvoicePaid = async () => {
    const title = invoiceForm.title.trim();
    const invoiceNumber = invoiceForm.invoice_number.trim();
    const amount = Number.parseFloat(invoiceForm.amount);
    const termMonths = Number.parseInt(invoiceForm.term_months, 10);
    const aprPercent = Number.parseFloat(invoiceForm.apr_percent);
    const fundingTarget = Number.parseFloat(
      invoiceForm.funding_target || invoiceForm.amount
    );

    if (!title || !invoiceNumber) {
      setInvoiceError(
        t("sme.errorTitleNumber", "Title and invoice number are required.")
      );
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setInvoiceError(t("sme.errorAmount", "Amount must be greater than 0."));
      return;
    }
    if (!Number.isFinite(termMonths) || termMonths <= 0) {
      setInvoiceError(t("sme.errorTerm", "Term must be greater than 0."));
      return;
    }
    if (!Number.isFinite(aprPercent) || aprPercent < 1 || aprPercent > 20) {
      setInvoiceError(
        t("sme.errorAprRange", "APR must be between 1% and 20% per year.")
      );
      return;
    }
    if (!invoiceForm.due_date) {
      setInvoiceError(t("sme.errorDueDate", "Due date is required."));
      return;
    }
    if (!Number.isFinite(fundingTarget) || fundingTarget <= 0) {
      setInvoiceError(
        t("sme.errorTarget", "Funding target must be greater than 0.")
      );
      return;
    }
    if (fundingTarget < amount) {
      setInvoiceError(
        t(
          "sme.errorTargetMin",
          "Funding target must be at least invoice amount."
        )
      );
      return;
    }

    const tags = invoiceForm.tags
      ? invoiceForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    setInvoiceLoading(true);
    setInvoiceError("");

    try {
      const token = await ensureRoleToken("sme");
      const created = await apiRequest("/invoices", {
        method: "POST",
        role: "sme",
        token,
        body: {
          title,
          invoice_number: invoiceNumber,
          amount,
          currency: invoiceForm.currency.trim().toUpperCase() || "USD",
          term_months: termMonths,
          apr_percent: aprPercent,
          due_date: invoiceForm.due_date,
          funding_target: fundingTarget,
          emergency_lane: invoiceForm.emergency_lane,
          tags,
        },
      });

      if (invoiceModalSubmit && created?.data?.id) {
        await apiRequest(`/invoices/${created.data.id}/submit`, {
          method: "POST",
          role: "sme",
          token,
        });
      }

      setInvoiceModalOpen(false);
      setRefreshKey((prev) => prev + 1);
      window.alert(
        invoiceModalSubmit
          ? t("sme.invoiceCreatedSubmitted", "Invoice created and submitted.")
          : t("sme.invoiceCreated", "Invoice created.")
      );
    } catch (err) {
      setInvoiceError(getErrorMessage(err));
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleSubmitCurrent = async () => {
    if (!currentInvoice?.id) {
      window.alert(t("sme.noInvoiceSubmit", "No invoice available to submit."));
      return;
    }

    if (currentInvoice.status !== "DRAFT") {
      window.alert(
        t("sme.alreadySubmitted", "Invoice is already submitted or approved.")
      );
      return;
    }

    try {
      const token = await ensureRoleToken("sme");
      await apiRequest(`/invoices/${currentInvoice.id}/submit`, {
        method: "POST",
        role: "sme",
        token,
      });
      setRefreshKey((prev) => prev + 1);
      window.alert(
        t("sme.submitted", "Invoice submitted for approval.")
      );
    } catch (err) {
      window.alert(getErrorMessage(err));
    }
  };

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

        const totalTarget = sumBy(invoices, (invoice) => invoice.funding_target);
        const totalCommitted = sumBy(
          invoices,
          (invoice) => invoice.funded_amount
        );
        const aprValues = invoices
          .map((invoice) => invoice.apr_percent)
          .filter((value) => typeof value === "number" && value > 0);
        const avgApr = aprValues.length
          ? aprValues.reduce((sum, value) => sum + value, 0) / aprValues.length
          : 0;

        setStats([
          {
            label: t("sme.stats.fundingTarget", "Funding target"),
            value: formatCurrencyShort(totalTarget),
            delta: t("sme.stats.goal", "Goal"),
            icon: "coins",
            tone: "primary",
          },
          {
            label: t("sme.stats.committed", "Committed"),
            value: formatCurrencyShort(totalCommitted),
            delta: totalTarget
              ? t("sme.completePercent", "{percent}% complete", {
                  percent: Math.round((totalCommitted / totalTarget) * 100),
                })
              : "0%",
            icon: "trend",
            tone: "success",
          },
          {
            label: t("sme.stats.offersPending", "Offers pending"),
            value: offers.length.toString(),
            delta: t("sme.stats.updated", "Updated"),
            icon: "handshake",
            tone: "warning",
          },
          {
            label: t("sme.stats.averageApr", "Average APR"),
            value: formatPercent(avgApr),
            delta: t("sme.stats.current", "Current"),
            icon: "chart",
            tone: "danger",
          },
        ]);

        const sorted = invoices
          .slice()
          .sort((a, b) => {
            const progressA = a.funding_target
              ? a.funded_amount / a.funding_target
              : 0;
            const progressB = b.funding_target
              ? b.funded_amount / b.funding_target
              : 0;
            return progressB - progressA;
          });

        setCurrentInvoice(sorted[0] || null);

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
          setCurrentInvoice(null);
          setOffers([]);
          setHangingFunds([]);
          setPortfolio([]);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [lang, offers.length, refreshKey, t]);

  const currentProgress = currentInvoice?.funding_target
    ? currentInvoice.funded_amount / currentInvoice.funding_target
    : 0;
  const annualApr = Number.parseFloat(invoiceForm.apr_percent);
  const monthlyApr = Number.isFinite(annualApr) ? annualApr / 12 : 0;
  const quarterlyApr = Number.isFinite(annualApr) ? annualApr / 4 : 0;
  const reviewingCount = currentProgress ? Math.round(currentProgress * 10) : 0;

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
      activeId="marketplace"
      title={t("sme.title", "SME funding workspace")}
      subtitle={t("sme.subtitle", "SME view")}
      searchId="sme-search"
      searchPlaceholder={t("sme.search", "Search offers, investors, invoices")}
      actions={
        <Button size="sm" onClick={() => openInvoiceModal(true)}>
          {t("sme.newRequest", "New request")}
        </Button>
      }
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
                {t("sme.fundingStatus", "Funding status")}
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {currentInvoice?.title || t("sme.noActiveInvoice", "No active invoice")}
              </p>
              <p className="text-xs text-muted">
                {t("sme.targetLine", "Target {amount} - {months} month term", {
                  amount: formatCurrencyShort(currentInvoice?.funding_target || 0),
                  months: currentInvoice?.term_months || 0,
                })}
              </p>
            </div>
            <Badge tone="primary">
              {t("admin.riskLabel", "Risk")} {currentInvoice?.risk_tier || "-"}
            </Badge>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink">
                {t("sme.committedLine", "{amount} committed", {
                  amount: formatCurrencyShort(currentInvoice?.funded_amount || 0),
                })}
              </span>
              <span className="text-muted">
                {t("sme.completePercent", "{percent}% complete", {
                  percent: Math.round(currentProgress * 100),
                })}
              </span>
            </div>
            <ProgressBar value={currentProgress} />
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
              <div className="flex items-center gap-2">
                <Icon name="clock" className="h-4 w-4 text-warning" />
                {t("sme.reviewingInvestors", "{count} investors reviewing", {
                  count: reviewingCount,
                })}
              </div>
              <div className="flex items-center gap-2">
                <Icon name="check" className="h-4 w-4 text-success" />
                {t("sme.escrowReady", "Escrow ready when 80%")}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" onClick={handleSubmitCurrent}>
                {t("sme.sendUpdate", "Send update")}
              </Button>
              <Button variant="outline" size="sm">
                {t("sme.adjustTerms", "Adjust terms")}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("sme.investorOffers", "Investor offers")}
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {t("sme.pendingProposals", "Pending proposals")}
              </p>
            </div>
            <Badge tone="warning">{t("sme.highApr", "High APR")}</Badge>
          </div>
          <div className="mt-6 space-y-4">
            {offers.map((offer) => (
              <div
                key={offer.investor}
                className="rounded-2xl border border-border bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">
                    {offer.investor}
                  </p>
                  <Badge tone="warning">{offer.apr} APR</Badge>
                </div>
                <p className="text-xs text-muted">
                  {offer.amount} - {offer.term}
                </p>
                <p className="mt-2 text-xs text-muted">{offer.note}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm">{t("sme.accept", "Accept")}</Button>
                  <Button variant="outline" size="sm">
                    {t("sme.negotiate", "Negotiate")}
                  </Button>
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
                {t("sme.hangingFunds", "Hanging funds")}
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {t("sme.emergencyHold", "Emergency capital on hold")}
              </p>
            </div>
            <Icon name="alert" className="h-6 w-6 text-warning" />
          </div>
          <div className="mt-6 space-y-4 text-sm">
            {hangingFunds.map((fund) => (
              <div
                key={fund.investor}
                className="rounded-2xl border border-border bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink">{fund.investor}</p>
                  <Badge tone="danger">{fund.apr} APR</Badge>
                </div>
                <p className="text-xs text-muted">{fund.amount}</p>
                <p className="mt-2 text-xs text-muted">{fund.note}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm">{t("sme.requestMatch", "Request match")}</Button>
                  <Button variant="outline" size="sm">
                    {t("sme.decline", "Decline")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {t("sme.portfolio", "Portfolio")}
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {t("sme.activeInvoices", "Active invoices")}
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
      </section>

      <Modal
        open={invoiceModalOpen}
        title={
          invoiceModalSubmit
            ? t("sme.createSubmitInvoice", "Create and submit invoice")
            : t("sme.createInvoice", "Create invoice")
        }
        subtitle={t("sme.invoiceSetup", "Invoice setup")}
        onClose={closeInvoiceModal}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={closeInvoiceModal}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button size="sm" onClick={handleInvoicePaid} disabled={invoiceLoading}>
              {invoiceLoading
                ? t("common.processing", "Processing...")
                : t("common.upload", "Upload")}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("sme.invoiceTitle", "Invoice title")}
            </label>
            <input
              type="text"
              value={invoiceForm.title}
              onChange={(event) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
              placeholder={t(
                "sme.invoiceTitlePlaceholder",
                "Quarterly shipment invoice"
              )}
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("sme.invoiceNumber", "Invoice number")}
            </label>
            <input
              type="text"
              value={invoiceForm.invoice_number}
              onChange={(event) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  invoice_number: event.target.value,
                }))
              }
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("sme.currency", "Currency")}
            </label>
            <select
              value={invoiceForm.currency}
              onChange={(event) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  currency: event.target.value,
                }))
              }
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("common.amount", "Amount")}
            </label>
            <input
              type="number"
              min="0"
              value={invoiceForm.amount}
              onChange={(event) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  amount: event.target.value,
                }))
              }
              placeholder="50000"
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("sme.termMonths", "Term months")}
            </label>
            <input
              type="number"
              min="1"
              value={invoiceForm.term_months}
              onChange={(event) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  term_months: event.target.value,
                }))
              }
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("sme.dueDate", "Due date")}
            </label>
            <input
              type="date"
              value={invoiceForm.due_date}
              onChange={(event) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  due_date: event.target.value,
                }))
              }
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("sme.aprAnnual", "Annual APR %")}
            </label>
            <input
              type="number"
              min="1"
              max="20"
              step="0.1"
              value={invoiceForm.apr_percent}
              onChange={(event) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  apr_percent: event.target.value,
                }))
              }
              placeholder="12"
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="mt-2 text-xs text-muted">
              {t("sme.aprBreakdown", "1-20%/year · Monthly {monthly} · Quarterly {quarterly}", {
                monthly: formatPercent(monthlyApr),
                quarterly: formatPercent(quarterlyApr),
              })}
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("sme.fundingTarget", "Funding target")}
            </label>
            <input
              type="number"
              min="0"
              value={invoiceForm.funding_target}
              onChange={(event) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  funding_target: event.target.value,
                }))
              }
              placeholder="50000"
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("sme.tags", "Tags")}
            </label>
            <input
              type="text"
              value={invoiceForm.tags}
              onChange={(event) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  tags: event.target.value,
                }))
              }
              placeholder={t("sme.tagsPlaceholder", "Retail, Logistics")}
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted md:col-span-2">
            <input
              type="checkbox"
              checked={invoiceForm.emergency_lane}
              onChange={(event) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  emergency_lane: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            {t("sme.emergencyLane", "Enable emergency lane")}
          </label>
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("sme.uploadLabel", "Upload invoice")}
            </label>
            <input
              type="file"
              accept="application/pdf,image/*"
              className="mt-2 block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
            />
            <p className="mt-2 text-xs text-muted">
              {t("sme.uploadHint", "PDF or image, optional for now.")}
            </p>
          </div>
        </div>
        {invoiceError ? (
          <p className="mt-4 text-xs text-danger">{invoiceError}</p>
        ) : null}
      </Modal>
    </DashboardShell>
  );
};

export default SmeDashboard;
