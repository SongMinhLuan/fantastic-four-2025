import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Icon from "../components/Icon";
import Logo from "../components/Logo";
import SectionHeading from "../components/SectionHeading";
import StatCard from "../components/StatCard";
import { apiRequest, storeAuthToken, storeAuthUser } from "../api/client";
import { useI18n } from "../i18n";
import {
  formatCurrencyShort,
  formatPercent,
  sumBy,
  uniqueCount,
} from "../utils/format";

const Home = () => {
  const { t, lang, setLang } = useI18n();
  const [stats, setStats] = useState([]);
  const [pipelineDeals, setPipelineDeals] = useState([]);
  const [marketSnapshot, setMarketSnapshot] = useState([]);
  const [impactScore, setImpactScore] = useState("-");
  const [snapshotNote, setSnapshotNote] = useState(() =>
    t(
      "home.pipeline.snapshotNote",
      "Average funding time: -. Investor capital waiting: -.",
      {
        avg: "-",
        demand: "-",
      }
    )
  );
  const [authTab, setAuthTab] = useState("login");
  const [registerRole, setRegisterRole] = useState("investor");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const clearAuthStatus = () => {
    setAuthMessage("");
    setAuthError("");
  };

  const scrollToSection = (id) => {
    if (typeof window === "undefined") {
      return;
    }
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const openLogin = () => {
    setAuthTab("login");
    clearAuthStatus();
    scrollToSection("auth");
  };

  const openRegister = (role) => {
    setAuthTab("register");
    if (role) {
      setRegisterRole(role);
    }
    clearAuthStatus();
    scrollToSection("auth");
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    clearAuthStatus();

    try {
      const payload = await apiRequest("/auth/login", {
        method: "POST",
        body: {
          email: loginForm.email,
          password: loginForm.password,
        },
      });
      const token = payload?.data?.access_token;
      const user = payload?.data?.user;
      storeAuthToken(token, user?.role);
      storeAuthUser(user);
      const roleLabel = user?.role
        ? t(`role.${user.role}`, user.role)
        : t("role.investor", "Investor");
      setAuthMessage(
        t("home.auth.loggedInAs", "Logged in as {role}.", { role: roleLabel })
      );
    } catch (err) {
      setAuthError(
        err?.payload?.error?.message ||
          err?.message ||
          t("home.auth.loginFailed", "Login failed")
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    clearAuthStatus();

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: {
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password,
          role: registerRole,
        },
      });

      const payload = await apiRequest("/auth/login", {
        method: "POST",
        body: {
          email: registerForm.email,
          password: registerForm.password,
        },
      });

      const token = payload?.data?.access_token;
      const user = payload?.data?.user;
      storeAuthToken(token, user?.role);
      storeAuthUser(user);

      setAuthMessage(
        t("home.auth.accountCreated", "Account created and logged in.")
      );
    } catch (err) {
      setAuthError(
        err?.payload?.error?.message ||
          err?.message ||
          t("home.auth.registerFailed", "Register failed")
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const homeFeatures = useMemo(
    () => [
      {
        title: t("home.features.riskTitle", "Risk tiers you can trust"),
        description: t(
          "home.features.riskDesc",
          "Every invoice is scored with cashflow, buyer credit, and repayment behavior."
        ),
        icon: "shield",
      },
      {
        title: t("home.features.escrowTitle", "Smart escrow for fast release"),
        description: t(
          "home.features.escrowDesc",
          "Funds are held until terms are met, then released to SMEs within hours."
        ),
        icon: "bank",
      },
      {
        title: t("home.features.returnsTitle", "Transparent returns"),
        description: t(
          "home.features.returnsDesc",
          "Clear APR, term, and fees so investors can back what they believe in."
        ),
        icon: "file",
      },
      {
        title: t("home.features.emergencyTitle", "Emergency liquidity lane"),
        description: t(
          "home.features.emergencyDesc",
          "SMEs can opt into a priority pool with higher rates when cash is urgent."
        ),
        icon: "bolt",
      },
    ],
    [t]
  );

  const homeSteps = useMemo(
    () => [
      {
        step: "01",
        title: t("home.steps.step1Title", "SME posts an invoice"),
        description: t(
          "home.steps.step1Desc",
          "Upload invoices, set target funding, and choose the return tier."
        ),
        icon: "briefcase",
      },
      {
        step: "02",
        title: t("home.steps.step2Title", "Investors fund with confidence"),
        description: t(
          "home.steps.step2Desc",
          "Pick opportunities, diversify quickly, and track expected yield."
        ),
        icon: "handshake",
      },
      {
        step: "03",
        title: t("home.steps.step3Title", "Smart repayment flow"),
        description: t(
          "home.steps.step3Desc",
          "Automated reminders and escrow release keep repayment on schedule."
        ),
        icon: "check",
      },
    ],
    [t]
  );

  const homeTestimonials = useMemo(
    () => [
      {
        name: "Linh Nguyen",
        role: "Operations Lead",
        company: "Horizon Textiles",
        quote: t(
          "home.testimonials.linhQuote",
          "InvoiceFlow cut our funding time from weeks to days. We can now take on bigger orders with confidence."
        ),
      },
      {
        name: "Minh Tran",
        role: "Angel Investor",
        company: "Independent",
        quote: t(
          "home.testimonials.minhQuote",
          "The marketplace is transparent and the risk tiers make it easy to build a portfolio that matches my goals."
        ),
      },
      {
        name: "Sara Le",
        role: "Finance Manager",
        company: "Lantern Foods",
        quote: t(
          "home.testimonials.saraQuote",
          "The emergency lane helped us survive a seasonal cash crunch without sacrificing supplier relationships."
        ),
      },
    ],
    [t]
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const payload = await apiRequest("/invoices?page=1&page_size=50", {
          role: "admin",
        });
        const invoices = payload.data || [];

        if (!active) {
          return;
        }

        const totalFunded = sumBy(invoices, (invoice) => invoice.funded_amount);
        const totalTarget = sumBy(invoices, (invoice) => invoice.funding_target);
        const activeSMEs = uniqueCount(invoices, (invoice) => invoice.issuer_id);
        const aprValues = invoices
          .map((invoice) => invoice.apr_percent)
          .filter((value) => typeof value === "number" && value > 0);
        const avgApr = aprValues.length
          ? aprValues.reduce((sum, value) => sum + value, 0) / aprValues.length
          : 0;

        const fundedInvoices = invoices.filter((invoice) =>
          ["FUNDED", "PARTIALLY_PAID", "PAID"].includes(invoice.status)
        );
        const avgFundingHours = fundedInvoices.length
          ? Math.round(
              sumBy(fundedInvoices, (invoice) => {
                const created = new Date(invoice.created_at);
                const updated = new Date(invoice.updated_at);
                return Math.max(0, updated - created) / 36e5;
              }) / fundedInvoices.length
            )
          : 0;

        const tagCounts = {};
        invoices.forEach((invoice) => {
          (invoice.tags || []).forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });

        const topTag = Object.keys(tagCounts).sort(
          (a, b) => tagCounts[b] - tagCounts[a]
        )[0];

        const demandRatio = totalFunded > 0 ? totalTarget / totalFunded : 0;

        setStats([
          {
            label: t("home.stats.capitalDeployed", "Capital deployed"),
            value: formatCurrencyShort(totalFunded),
            delta: t("home.stats.invoicesListed", "{count} invoices listed", {
              count: invoices.length,
            }),
            icon: "coins",
            tone: "primary",
          },
          {
            label: t("home.stats.activeSmes", "Active SMEs"),
            value: activeSMEs.toString(),
            delta: t("home.stats.verifiedIssuers", "Verified issuers"),
            icon: "building",
            tone: "success",
          },
          {
            label: t("home.stats.netYield", "Investor net yield"),
            value: formatPercent(avgApr),
            delta: t("home.stats.avgAnnualized", "Avg annualized"),
            icon: "trend",
            tone: "warning",
          },
        ]);

        const pipeline = invoices
          .slice()
          .sort((a, b) => {
            const progressA = a.funding_target
              ? a.funded_amount / a.funding_target
              : 0;
            const progressB = b.funding_target
              ? b.funded_amount / b.funding_target
              : 0;
            return progressB - progressA;
          })
          .slice(0, 3)
          .map((invoice) => {
            const progress = invoice.funding_target
              ? invoice.funded_amount / invoice.funding_target
              : 0;
            let status = t("home.pipeline.fundedPercent", "Funded {percent}%", {
              percent: Math.round(progress * 100),
            });
            let tone = "primary";
            if (progress >= 0.8) {
              status = t("home.pipeline.escrowReady", "Escrow ready");
              tone = "success";
            } else if (invoice.emergency_lane) {
              status = t("home.pipeline.emergencyLane", "Emergency lane");
              tone = "warning";
            }
            return {
              name: invoice.title,
              amount: formatCurrencyShort(invoice.funding_target),
              status,
              tone,
            };
          });

        setPipelineDeals(pipeline);

        const avgFundingLabel = avgFundingHours
          ? t("time.hours", "{count} hours", { count: avgFundingHours })
          : "-";
        const demandLabel = demandRatio ? `${demandRatio.toFixed(1)}x` : "-";

        setMarketSnapshot([
          {
            label: t("home.snapshot.avgFundingTime", "Avg. funding time"),
            value: avgFundingLabel,
            note: t("home.snapshot.avgFundingNote", "From listing to payout"),
          },
          {
            label: t("home.snapshot.topSectorDemand", "Top sector demand"),
            value: topTag || t("common.general", "General"),
            note: t("home.snapshot.topSectorNote", "Based on invoice tags"),
          },
          {
            label: t("home.snapshot.investorDemand", "Investor demand"),
            value: demandLabel,
            note: t(
              "home.snapshot.investorDemandNote",
              "Capital waiting vs. requests"
            ),
          },
        ]);

        setSnapshotNote(
          t(
            "home.pipeline.snapshotNote",
            "Average funding time: {avg}. Investor capital waiting: {demand}.",
            { avg: avgFundingLabel, demand: demandLabel }
          )
        );

        setImpactScore(Math.min(99, activeSMEs || 0).toString());
      } catch (err) {
        if (active) {
          setStats([]);
          setPipelineDeals([]);
          setMarketSnapshot([]);
          setImpactScore("-");
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [lang, t]);

  return (
    <div className="bg-base text-ink">
      <section className="bg-aurora">
        <div className="mx-auto flex max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
            <Logo />
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted md:gap-6">
              <button
                type="button"
                className="cursor-pointer hover:text-ink"
                onClick={() => scrollToSection("how-it-works")}
              >
                {t("home.nav.howItWorks", "How it works")}
              </button>
              <button
                type="button"
                className="cursor-pointer hover:text-ink"
                onClick={() => scrollToSection("for-investors")}
              >
                {t("home.nav.forInvestors", "For investors")}
              </button>
              <button
                type="button"
                className="cursor-pointer hover:text-ink"
                onClick={() => scrollToSection("for-smes")}
              >
                {t("home.nav.forSmes", "For SMEs")}
              </button>
              <button
                type="button"
                className="cursor-pointer hover:text-ink"
                onClick={() => scrollToSection("impact")}
              >
                {t("home.nav.impact", "Impact")}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                aria-pressed={lang === "en"}
                onClick={() => setLang("en")}
                className={lang === "en" ? "border-primary text-primary" : ""}
              >
                {t("common.english", "English")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                aria-pressed={lang === "vi"}
                onClick={() => setLang("vi")}
                className={lang === "vi" ? "border-primary text-primary" : ""}
              >
                {t("common.vietnamese", "Vietnamese")}
              </Button>
              <Button variant="ghost" size="sm" onClick={openLogin}>
                {t("common.login", "Login")}
              </Button>
              <Button size="sm" onClick={() => openRegister("investor")}>
                {t("home.nav.getStarted", "Get started")}
              </Button>
            </div>
          </nav>

          <div className="grid gap-10 pb-16 pt-10 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col gap-6 animate-fade-up">
              <Badge tone="primary">
                {t(
                  "home.hero.badge",
                  "Invoice-backed capital marketplace"
                )}
              </Badge>
              <h1 className="font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
                {t(
                  "home.hero.title",
                  "Connect urgent SME invoices with investors seeking higher returns."
                )}
              </h1>
              <p className="text-base text-muted md:text-lg">
                {t(
                  "home.hero.description",
                  "InvoiceFlow is the bridge between SMEs and investors. SMEs unlock working capital fast, and investors earn transparent, higher-than bank yields with built-in risk tiers."
                )}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={() => openRegister("investor")}>
                  {t("home.hero.startInvesting", "Start investing")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => openRegister("sme")}
                >
                  {t("home.hero.applySme", "Apply as SME")}
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted">
                <div className="flex items-center gap-2">
                  <Icon name="check" className="h-4 w-4 text-success" />
                  {t("home.hero.verifiedInvoices", "Verified invoices")}
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="shield" className="h-4 w-4 text-primary" />
                  {t("home.hero.riskTieredReturns", "Risk-tiered returns")}
                </div>
              </div>
            </div>

            <div className="relative animate-fade-up">
              <div className="glass-panel rounded-3xl p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    {t("home.pipeline.title", "Funding pipeline")}
                  </p>
                  <Badge tone="success">
                    {t("home.pipeline.live", "Live")}
                  </Badge>
                </div>
                <div className="mt-6 grid gap-4">
                  {pipelineDeals.map((deal) => (
                    <div
                      key={deal.name}
                      className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {deal.name}
                        </p>
                        <p className="text-xs text-muted">{deal.status}</p>
                      </div>
                      <Badge tone={deal.tone}>{deal.amount}</Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-muted">
                  {snapshotNote}
                </div>
              </div>
              <div className="absolute -bottom-10 -right-6 hidden w-56 rounded-3xl border border-border bg-white p-4 shadow-card lg:block">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {t("home.pipeline.impactScore", "Impact score")}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold text-ink">
                  {impactScore}
                </p>
                <p className="text-xs text-muted">
                  {t(
                    "home.pipeline.impactNote",
                    "SMEs supported across the network."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-base py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section className="bg-base py-16 scroll-mt-24" id="for-smes">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={t("home.sections.whyEyebrow", "Why InvoiceFlow")}
            title={t(
              "home.sections.whyTitle",
              "Designed for trust, speed, and transparent returns."
            )}
            description={t(
              "home.sections.whyDescription",
              "We blend fintech-level diligence with SME-first speed. Investors see clear risk tiers and SMEs get fast access to capital."
            )}
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {homeFeatures.map((feature) => (
              <div
                key={feature.title}
                className="cursor-pointer rounded-3xl border border-border bg-white p-6 shadow-card transition-colors duration-200 hover:border-slate-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon name={feature.icon} className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="bg-slate-50/70 py-16 scroll-mt-24"
        id="how-it-works"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={t("home.sections.howEyebrow", "How it works")}
            title={t(
              "home.sections.howTitle",
              "Three steps to activate working capital."
            )}
            description={t(
              "home.sections.howDescription",
              "The platform guides SMEs and investors through a simple, secure flow."
            )}
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {homeSteps.map((step) => (
              <div
                key={step.step}
                className="cursor-pointer rounded-3xl border border-border bg-white p-6 shadow-card transition-colors duration-200 hover:border-slate-300"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">
                    {step.step}
                  </span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon name={step.icon} className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-base py-16 scroll-mt-24" id="for-investors">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={t("home.sections.pulseEyebrow", "Marketplace pulse")}
            title={t(
              "home.sections.pulseTitle",
              "Real-time insights from the invoice economy."
            )}
            description={t(
              "home.sections.pulseDescription",
              "Investors see demand, SMEs see available capital, and admins keep the system healthy."
            )}
          />
          <div className="grid gap-6 md:grid-cols-3">
            {marketSnapshot.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-border bg-white p-6 shadow-card"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  {item.label}
                </p>
                <p className="mt-3 font-display text-2xl font-semibold text-ink">
                  {item.value}
                </p>
                <p className="mt-2 text-sm text-muted">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-base py-16 scroll-mt-24" id="impact">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={t("home.sections.testimonialsEyebrow", "Testimonials")}
            title={t(
              "home.sections.testimonialsTitle",
              "SMEs and investors who rely on InvoiceFlow."
            )}
            description={t(
              "home.sections.testimonialsDescription",
              "Social proof from teams using the platform to move faster."
            )}
            align="center"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {homeTestimonials.map((item, index) => (
              <div
                key={item.name}
                className="animate-fade-up rounded-3xl border border-border bg-white p-6 shadow-card"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <p className="text-sm text-muted">"{item.quote}"</p>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-ink">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.role}, {item.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-base py-16 scroll-mt-24" id="auth">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <SectionHeading
                eyebrow={t("home.auth.eyebrow", "Get started")}
                title={t(
                  "home.auth.title",
                  "Access the marketplace in minutes."
                )}
                description={t(
                  "home.auth.description",
                  "Create a free account to submit invoices or fund verified opportunities."
                )}
              />
              <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon name="shield" className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {t("home.auth.secureTitle", "Secure onboarding")}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {t(
                        "home.auth.secureDesc",
                        "We use JWT authentication and role-based access to keep every dashboard protected."
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 text-warning">
                    <Icon name="bolt" className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {t("home.auth.roleTitle", "Quick role setup")}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {t(
                        "home.auth.roleDesc",
                        "Choose investor or SME and we tailor the onboarding flow instantly."
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("login");
                    clearAuthStatus();
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
                    authTab === "login"
                      ? "bg-primary text-white"
                      : "border border-border text-muted hover:text-ink"
                  }`}
                >
                  {t("common.login", "Login")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("register");
                    clearAuthStatus();
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
                    authTab === "register"
                      ? "bg-primary text-white"
                      : "border border-border text-muted hover:text-ink"
                  }`}
                >
                  {t("common.register", "Register")}
                </button>
              </div>

              {authTab === "login" ? (
                <form className="mt-6 space-y-4" onSubmit={handleLoginSubmit}>
                  <div>
                    <label
                      htmlFor="login-email"
                      className="text-xs uppercase tracking-[0.2em] text-muted"
                    >
                      Email
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={loginForm.email}
                      onChange={(event) =>
                        setLoginForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      placeholder="you@company.com"
                      className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="login-password"
                      className="text-xs uppercase tracking-[0.2em] text-muted"
                    >
                      {t("common.password", "Password")}
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      required
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      placeholder={t("home.auth.password", "Enter password")}
                      className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  {authError ? (
                    <p className="text-xs text-danger">{authError}</p>
                  ) : null}
                  {authMessage ? (
                    <p className="text-xs text-success">{authMessage}</p>
                  ) : null}
                  <Button
                    size="sm"
                    className="w-full"
                    type="submit"
                    disabled={authLoading}
                  >
                    {authLoading
                      ? t("common.processing", "Working...")
                      : t("common.login", "Login")}
                  </Button>
                </form>
              ) : (
                <form
                  className="mt-6 space-y-4"
                  onSubmit={handleRegisterSubmit}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="register-name"
                        className="text-xs uppercase tracking-[0.2em] text-muted"
                      >
                        {t("home.auth.fullName", "Full name")}
                      </label>
                      <input
                        id="register-name"
                        type="text"
                        required
                        value={registerForm.name}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        placeholder={t("home.auth.fullName", "Your name")}
                        className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="register-role"
                        className="text-xs uppercase tracking-[0.2em] text-muted"
                      >
                        {t("home.auth.roleLabel", "Role")}
                      </label>
                      <select
                        id="register-role"
                        value={registerRole}
                        onChange={(event) =>
                          setRegisterRole(event.target.value)
                        }
                        className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="investor">
                          {t("role.investor", "Investor")}
                        </option>
                        <option value="sme">{t("role.sme", "SME")}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="register-email"
                      className="text-xs uppercase tracking-[0.2em] text-muted"
                    >
                      Email
                    </label>
                    <input
                      id="register-email"
                      type="email"
                      required
                      value={registerForm.email}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      placeholder="you@company.com"
                      className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="register-password"
                      className="text-xs uppercase tracking-[0.2em] text-muted"
                    >
                      {t("common.password", "Password")}
                    </label>
                    <input
                      id="register-password"
                      type="password"
                      required
                      minLength={8}
                      value={registerForm.password}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      placeholder={t(
                        "home.auth.passwordCreate",
                        "Create a password"
                      )}
                      className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  {authError ? (
                    <p className="text-xs text-danger">{authError}</p>
                  ) : null}
                  {authMessage ? (
                    <p className="text-xs text-success">{authMessage}</p>
                  ) : null}
                  <Button
                    size="sm"
                    className="w-full"
                    type="submit"
                    disabled={authLoading}
                  >
                    {authLoading
                      ? t("common.processing", "Working...")
                      : t("home.auth.createAccount", "Create account")}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-base py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2.5rem] border border-border bg-aurora p-10 shadow-card">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {t("home.ready.eyebrow", "Ready to launch")}
                </p>
                <h3 className="mt-3 font-display text-3xl font-semibold text-ink">
                  {t(
                    "home.ready.title",
                    "Start funding invoices or unlock SME liquidity today."
                  )}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  {t(
                    "home.ready.description",
                    "Join the early network to shape the future blockchain-backed rails."
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={() => openRegister("investor")}>
                  {t("home.ready.joinInvestor", "Join as investor")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => openRegister("sme")}
                >
                  {t("home.ready.applySme", "Apply as SME")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 text-sm text-muted sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Logo />
          <div className="flex flex-wrap gap-4">
            <button type="button" className="cursor-pointer hover:text-ink">
              {t("home.footer.about", "About")}
            </button>
            <button type="button" className="cursor-pointer hover:text-ink">
              {t("home.footer.risk", "Risk policy")}
            </button>
            <button type="button" className="cursor-pointer hover:text-ink">
              {t("home.footer.compliance", "Compliance")}
            </button>
            <button type="button" className="cursor-pointer hover:text-ink">
              {t("home.footer.contact", "Contact")}
            </button>
          </div>
          <p className="text-xs text-muted">
            {t(
              "home.footer.tagline",
              "InvoiceFlow. Building SME resilience with transparent capital."
            )}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
