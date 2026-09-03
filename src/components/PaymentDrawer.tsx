import { useEffect, useState } from "react";
import type { TFunction } from "i18next";
import { ArrowRight, ChevronDown, ExternalLink } from "lucide-react";
import QRCode from "qrcode";
import { formatProductPrice, type PaymentOption } from "../lib/products";

interface PaymentDrawerProps {
  locale: string | undefined;
  open: boolean;
  options: readonly PaymentOption[];
  onToggle: () => void;
  t: TFunction;
}

export function PaymentDrawer({ locale, open, options, onToggle, t }: PaymentDrawerProps) {
  const [selectedKey, setSelectedKey] = useState(options[0].key);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const selectedOption = options.find((option) => option.key === selectedKey) ?? options[0];

  useEffect(() => {
    if (!open) return;
    let active = true;
    QRCode.toDataURL(selectedOption.paymentUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 220,
      color: { dark: "#111827", light: "#ffffff" },
    }).then((url) => {
      if (active) setQrDataUrl(url);
    });
    return () => { active = false; };
  }, [open, selectedOption.paymentUrl]);

  return (
    <div className={open ? "payment-drawer is-open" : "payment-drawer"}>
      <button className="service-payment-toggle" type="button" onClick={onToggle} aria-expanded={open}>
        {t("services.learnMore")} <ChevronDown size={17} />
      </button>
      <div className="payment-drawer-clip" aria-hidden={!open} inert={!open}>
        <div className="payment-drawer-panel">
          {options.length > 1 && (
            <div className="payment-option-tabs" aria-label={t("request.consultingDuration")}>
              {options.map((option) => (
                <button
                  className={selectedOption.key === option.key ? "is-selected" : ""}
                  type="button"
                  key={option.key}
                  onClick={() => setSelectedKey(option.key)}
                >
                  {option.minutes} min · {formatProductPrice(option.amountCents, locale)}
                </button>
              ))}
            </div>
          )}
          <a className="payment-link" href={selectedOption.paymentUrl} target="_blank" rel="noreferrer">
            {t("services.openPayment")} · {formatProductPrice(selectedOption.amountCents, locale)}
            <ExternalLink size={16} />
          </a>
          <div className="payment-qr">
            <p>{t("services.qrHelp")}</p>
            {qrDataUrl && <img src={qrDataUrl} alt={t("services.qrAlt")} />}
          </div>
          <p className="stripe-note">{t("services.stripeNote")} <ArrowRight size={13} /></p>
        </div>
      </div>
    </div>
  );
}
