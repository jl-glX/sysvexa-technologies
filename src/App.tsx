import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check, ChevronDown, CircleCheck, Clock3, HardDrive, Menu, Network, ShieldCheck, Sparkles, Wrench, X } from "lucide-react";
import { CaptchaWidget } from "./components/CaptchaWidget";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { submitServiceRequest } from "./lib/service-requests";

const services = [
  { key: "maintenance", icon: Wrench },
  { key: "computers", icon: HardDrive },
  { key: "networks", icon: Network },
  { key: "security", icon: ShieldCheck },
] as const;

export default function App() {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [requestStatus, setRequestStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!captchaToken || requestStatus === "sending") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setRequestStatus("sending");
    try {
      await submitServiceRequest({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        phone: String(data.get("phone") ?? ""),
        service: String(data.get("service") ?? ""),
        details: String(data.get("details") ?? ""),
        locale: i18n.resolvedLanguage ?? i18n.language,
        consent: data.get("consent") === "on",
        captchaToken,
        website: String(data.get("website") ?? ""),
      });
      form.reset();
      setRequestStatus("sent");
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
          </div>
          <div className="service-grid">
            {services.map(({ key, icon: Icon }, index) => (
              <article className="service-card" key={key}>
                <div className="card-top"><span className="service-icon"><Icon /></span><span className="service-number">0{index + 1}</span></div>
                <h3>{t(`services.${key}.title`)}</h3>
                <p>{t(`services.${key}.description`)}</p>
                <a href="#request">{t("services.learnMore")} <ArrowRight size={16} /></a>
              </article>
            ))}
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
                <label>{t("request.service")}<span className="select-wrap"><select name="service" required defaultValue=""><option value="" disabled>{t("request.servicePlaceholder")}</option>{services.map(({ key }) => <option key={key} value={key}>{t(`services.${key}.title`)}</option>)}</select><ChevronDown size={18} /></span></label>
                <label>{t("request.details")}<textarea name="details" required rows={4} placeholder={t("request.detailsPlaceholder")} /></label>
                <label className="check-label"><input name="consent" type="checkbox" required /><span>{t("request.consent")}</span></label>
                <CaptchaWidget onToken={setCaptchaToken} resetSignal={captchaResetSignal} />
                {requestStatus === "error" && <p className="form-error" role="alert">{t("request.error")}</p>}
                <button className="button submit-button" type="submit" disabled={!captchaToken || requestStatus === "sending"}>{requestStatus === "sending" ? t("request.sending") : t("request.submit")} <ArrowRight size={18} /></button>
                <p className="form-note"><ShieldCheck size={15} /> {t("request.privacyNote")}</p>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer id="contact">
        <div className="footer-main">
          <div className="footer-brand"><img className="footer-mark" src="/brand/sysvexa-mark.png" alt="" /><p>{t("footer.description")}</p></div>
          <div><h3>{t("footer.servicesTitle")}</h3><a href="#services">{t("services.maintenance.title")}</a><a href="#services">{t("services.computers.title")}</a><a href="#services">{t("services.networks.title")}</a><a href="#services">{t("services.security.title")}</a></div>
          <div><h3>{t("footer.contactTitle")}</h3><a href="mailto:hola@sysvexa.tech">hola@sysvexa.tech</a><span>{t("footer.location")}</span><span>{t("footer.schedule")}</span></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Sysvexa Technologies</span><span>{t("footer.legal")}</span></div>
      </footer>
    </div>
  );
}
