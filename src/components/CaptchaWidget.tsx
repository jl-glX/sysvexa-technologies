import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { turnstileLanguage } from "../lib/captcha-localization";

const scriptId = "cloudflare-turnstile-script";
const scriptUrl =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          action: string;
          theme: "auto";
          size: "flexible";
          language: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => boolean;
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(scriptId);
    if (existing && !window.turnstile) existing.remove();
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      scriptPromise = null;
      reject(new Error("Turnstile loading timed out"));
    }, 10_000);
    script.id = scriptId;
    script.src = scriptUrl;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.clearTimeout(timeout);
      if (!window.turnstile) {
        scriptPromise = null;
        reject(new Error("Turnstile did not initialize"));
        return;
      }
      resolve();
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      scriptPromise = null;
      reject(new Error("Turnstile could not be loaded"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

async function fetchCaptchaSiteKey(): Promise<string> {
  const response = await fetch("/api/service-requests/captcha-config", {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  const payload = (await response.json().catch(() => ({}))) as {
    available?: boolean;
    siteKey?: string | null;
  };
  if (!response.ok || !payload.available || !payload.siteKey) {
    throw new Error("Turnstile is not configured");
  }
  return payload.siteKey;
}

export function CaptchaWidget({
  onToken,
  resetSignal = 0,
}: {
  onToken: (token: string) => void;
  resetSignal?: number;
}) {
  const containerId = `turnstile-${useId().replaceAll(":", "")}`;
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [failed, setFailed] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const { i18n, t } = useTranslation();
  onTokenRef.current = onToken;

  useEffect(() => {
    let disposed = false;
    onTokenRef.current("");
    setFailed(false);

    Promise.all([loadTurnstile(), fetchCaptchaSiteKey()])
      .then(([, siteKey]) => {
        if (disposed || !window.turnstile) return;
        widgetId.current = window.turnstile.render(`#${containerId}`, {
          sitekey: siteKey,
          action: "service_request",
          theme: "auto",
          size: "flexible",
          language: turnstileLanguage(
            i18n.resolvedLanguage ?? i18n.language,
          ),
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(""),
          "error-callback": () => {
            onTokenRef.current("");
            setFailed(true);
            return true;
          },
        });
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });

    return () => {
      disposed = true;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
      widgetId.current = null;
    };
  }, [containerId, i18n.language, i18n.resolvedLanguage, resetSignal, retryAttempt]);

  if (failed) {
    return (
      <div className="captcha-error" role="alert">
        <p>{t("captcha.error")}</p>
        <button
          type="button"
          onClick={() => setRetryAttempt((attempt) => attempt + 1)}
        >
          {t("captcha.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="captcha-widget" aria-label={t("captcha.label")}>
      <div id={containerId} className="captcha-container" />
    </div>
  );
}
