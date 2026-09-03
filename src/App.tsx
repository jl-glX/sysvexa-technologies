import { useState, type FormEvent } from "react";
import { Trans, useTranslation } from "react-i18next";
import { ArrowRight, Check, CircleCheck, Clock3, HardDrive, Lightbulb, Menu, Network, ShieldCheck, Sparkles, Wrench, X } from "lucide-react";
import { CaptchaWidget } from "./components/CaptchaWidget";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { PaymentDrawer } from "./components/PaymentDrawer";
import { ProductSelector } from "./components/ProductSelector";
import { products, resolveProductSelection, type ProductKey } from "./lib/products";
import { submitServiceRequest } from "./lib/service-requests";

const productIcons = {
  maintenance: Wrench,
  computers: HardDrive,
  networks: Network,
  security: ShieldCheck,
  consulting: Lightbulb,
} as const;

export default function App() {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [requestStatus, setRequestStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<ProductKey | "">("");
  const [selectedOption, setSelectedOption] = useState("");
  const [openPaymentProduct, setOpenPaymentProduct] = useState<ProductKey | null>(null);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!captchaToken || requestStatus === "sending") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const selection = resolveProductSelection(selectedProduct, selectedOption);
    if (!selection) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const shouldPay = submitter instanceof HTMLButtonElement
      && submitter.value === "pay";
    setRequestStatus("sending");
    try {
      await submitServiceRequest({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        phone: String(data.get("phone") ?? ""),
        service: selection.service,
        details: String(data.get("details") ?? ""),
        locale: i18n.resolvedLanguage ?? i18n.language,
        consent: data.get("privacyAcknowledged") === "on",
        captchaToken,
        website: String(data.get("website") ?? ""),
      });
      form.reset();
      setSelectedProduct("");
      setSelectedOption("");
      setRequestStatus("sent");
      if (shouldPay) window.location.assign(selection.paymentOption.paymentUrl);
    } catch {
      setRequestStatus("error");
    } finally {
      setCaptchaToken("");
      setCaptchaResetSignal((signal) => signal + 1);
    }
  }

  function closeMenu() { setMenuOpen(false); }

  return (
    <div className="site-shell">
      <header className="brand-header" id="top">
        <a className="header-brand" href="#top" aria-label="Sysvexa Technologies">
          <img className="header-logo" src="/brand/sysvexa-header.png" alt={t("brand.imageAlt")} />
        </a>
      </header>

      <div className="site-header">
        <nav className={menuOpen ? "nav-links is-open" : "nav-links"} aria-label={t("nav.ariaLabel")}>
          <a href="#services" onClick={closeMenu}>{t("nav.services")}</a>
          <a href="#process" onClick={closeMenu}>{t("nav.howItWorks")}</a>
          <a href="#request" onClick={closeMenu}>{t("nav.request")}</a>
          <a href="#contact" onClick={closeMenu}>{t("nav.contact")}</a>
        </nav>
        <div className="header-actions">
          <LanguageSwitcher />
          <a className="button button-small" href="#request">{t("nav.cta")}</a>
          <button className="menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={t("nav.menu")}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <main>
        <section className="hero section-pad">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={15} /> {t("hero.eyebrow")}</span>
            <h1>{t("hero.titleStart")} <span>{t("hero.titleAccent")}</span></h1>
            <p className="hero-lead">{t("hero.description")}</p>
            <div className="hero-actions">
              <a className="button" href="#request">{t("hero.primaryCta")} <ArrowRight size={18} /></a>
              <a className="button button-ghost" href="#services">{t("hero.secondaryCta")}</a>
            </div>
            <div className="hero-proof">
              <span><CircleCheck size={18} /> {t("hero.proof1")}</span>
              <span><Clock3 size={18} /> {t("hero.proof2")}</span>
            </div>
          </div>
          <div className="hero-visual" aria-label={t("brand.visualLabel")}>
            <div className="signal signal-one" />
            <div className="signal signal-two" />
            <div className="hero-mark"><img src="/brand/sysvexa-mark.png" alt="" /></div>
            <div className="service-status">
              <span className="status-icon"><Check size={18} /></span>
              <span><small>{t("hero.statusLabel")}</small><strong>{t("hero.statusValue")}</strong></span>
            </div>
          </div>
        </section>

        <section className="trust-strip" aria-label={t("trust.ariaLabel")}>
          <span>{t("trust.intro")}</span>
          <strong>{t("trust.item1")}</strong><i />
          <strong>{t("trust.item2")}</strong><i />
          <strong>{t("trust.item3")}</strong>
        </section>

        <section className="services section-pad" id="services">
          <div className="section-heading">
            <span className="kicker">{t("services.kicker")}</span>
            <h2>{t("services.title")}</h2>
            <p>{t("services.description")}</p>
            <p className="payment-fallback-note">{t("services.paymentFallback")}</p>
          </div>
          <div className="service-grid">
            {products.map((product, index) => {
              const Icon = productIcons[product.key];
              return (
                <article className="service-card" key={product.key}>
                  <div className="card-top"><span className="service-icon"><Icon /></span><span className="service-number">0{index + 1}</span></div>
                  <h3>{t(`services.${product.key}.title`)}</h3>
                  <p>{t(`services.${product.key}.description`)}</p>
                  <PaymentDrawer
                    locale={i18n.resolvedLanguage ?? i18n.language}
                    open={openPaymentProduct === product.key}
                    options={product.paymentOptions}
                    onToggle={() => setOpenPaymentProduct((current) => current === product.key ? null : product.key)}
                    t={t}
                  />
                </article>
              );
            })}
          </div>
        </section>

        <section className="process section-pad" id="process">
          <div className="section-heading section-heading-light">
            <span className="kicker">{t("process.kicker")}</span>
            <h2>{t("process.title")}</h2>
            <p>{t("process.description")}</p>
          </div>
          <div className="process-grid">
            {["request", "diagnosis", "solution"].map((step, index) => (
              <article className="process-step" key={step}>
                <span className="step-number">{index + 1}</span>
                <h3>{t(`process.${step}.title`)}</h3>
                <p>{t(`process.${step}.description`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="request-section section-pad" id="request">
          <div className="request-copy">
            <span className="kicker">{t("request.kicker")}</span>
            <h2>{t("request.title")}</h2>
            <p>{t("request.description")}</p>
            <ul>
              <li><Check size={17} /> {t("request.benefit1")}</li>
              <li><Check size={17} /> {t("request.benefit2")}</li>
              <li><Check size={17} /> {t("request.benefit3")}</li>
            </ul>
          </div>
          <div className="request-card">
            {requestStatus === "sent" ? (
              <div className="success-state" role="status">
                <span><CircleCheck size={38} /></span>
                <h3>{t("request.successTitle")}</h3>
                <p>{t("request.successDescription")}</p>
                <button type="button" className="button button-ghost" onClick={() => setRequestStatus("idle")}>{t("request.newRequest")}</button>
              </div>
            ) : (
              <form onSubmit={submitRequest} aria-busy={requestStatus === "sending"}>
                <div className="form-heading"><h3>{t("request.formTitle")}</h3><span>{t("request.required")}</span></div>
                <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
                <label>{t("request.name")}<input name="name" required autoComplete="name" placeholder={t("request.namePlaceholder")} /></label>
                <div className="form-row">
                  <label>{t("request.email")}<input name="email" type="email" required autoComplete="email" placeholder={t("request.emailPlaceholder")} /></label>
                  <label>{t("request.phone")}<input name="phone" type="tel" autoComplete="tel" placeholder={t("request.phonePlaceholder")} /></label>
                </div>
                <ProductSelector
                  locale={i18n.resolvedLanguage ?? i18n.language}
                  selectedProduct={selectedProduct}
                  selectedOption={selectedOption}
                  setSelectedProduct={setSelectedProduct}
                  setSelectedOption={setSelectedOption}
                  t={t}
                />
                <label>{t("request.details")}<textarea name="details" required rows={4} placeholder={t("request.detailsPlaceholder")} /></label>
                <aside className="privacy-summary" aria-labelledby="privacy-summary-title">
                  <h4 id="privacy-summary-title">{t("request.privacySummary.title")}</h4>
                  <p>{t("request.privacySummary.controller")}</p>
                  <p>{t("request.privacySummary.purpose")}</p>
                  <p>{t("request.privacySummary.basis")}</p>
                  <p>{t("request.privacySummary.recipients")}</p>
                  <p>{t("request.privacySummary.rights")}</p>
                  <div className="privacy-summary-links">
                    <a href="/proteccion-de-datos" target="_blank" rel="noreferrer">{t("request.privacySummary.fullInfo")}</a>
                    <a href="/politica-de-privacidad" target="_blank" rel="noreferrer">{t("request.privacySummary.policy")}</a>
                  </div>
                </aside>
                <label className="check-label">
                  <input name="privacyAcknowledged" type="checkbox" required />
                  <span>
                    <Trans
                      i18nKey="request.acknowledgement"
                      components={{ dataProtectionLink: <a href="/proteccion-de-datos" target="_blank" rel="noreferrer" /> }}
                    />
                  </span>
                </label>
                <CaptchaWidget onToken={setCaptchaToken} resetSignal={captchaResetSignal} />
                {requestStatus === "error" && <p className="form-error" role="alert">{t("request.error")}</p>}
                <div className="form-submit-actions">
                  <button className="button submit-button" type="submit" name="intent" value="request" disabled={!captchaToken || requestStatus === "sending"}>{requestStatus === "sending" ? t("request.sending") : t("request.submit")} <ArrowRight size={18} /></button>
                  <button className="button submit-button submit-and-pay-button" type="submit" name="intent" value="pay" disabled={!captchaToken || requestStatus === "sending"}>{requestStatus === "sending" ? t("request.sending") : t("request.submitAndPay")} <ArrowRight size={18} /></button>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer id="contact">
        <div className="footer-main">
          <div className="footer-brand"><img className="footer-mark" src="/brand/sysvexa-mark.png" alt="" /><p>{t("footer.description")}</p></div>
          <div><h3>{t("footer.servicesTitle")}</h3><a href="#services">{t("services.maintenance.title")}</a><a href="#services">{t("services.computers.title")}</a><a href="#services">{t("services.networks.title")}</a><a href="#services">{t("services.security.title")}</a><a href="#services">{t("services.consulting.title")}</a></div>
          <div><h3>{t("footer.contactTitle")}</h3><a href="mailto:u3849730636@gmail.com">u3849730636@gmail.com</a><span>{t("footer.location")}</span><span>{t("footer.schedule")}</span></div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Sysvexa Technologies</span>
          <nav className="footer-legal" aria-label={t("footer.legalAriaLabel")}>
            <a href="/proteccion-de-datos">{t("footer.dataProtection")}</a>
            <a href="/politica-de-privacidad">{t("footer.privacy")}</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
