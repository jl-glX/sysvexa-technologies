CREATE TABLE sysvexa_service_requests_v2 (
  id TEXT PRIMARY KEY CHECK (length(id) = 36),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 100),
  email TEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  phone TEXT CHECK (phone IS NULL OR length(phone) <= 40),
  service TEXT NOT NULL CHECK (
    service IN ('maintenance', 'computers', 'networks', 'security', 'consulting')
  ),
  product_option TEXT CHECK (
    product_option IS NULL OR
    product_option IN ('consulting_30', 'consulting_60', 'consulting_90')
  ),
  details TEXT NOT NULL CHECK (length(details) BETWEEN 10 AND 4000),
  locale TEXT NOT NULL CHECK (length(locale) BETWEEN 2 AND 20),
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'contacted', 'in_progress', 'closed')
  ),
  source TEXT NOT NULL DEFAULT 'website',
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (service = 'consulting' AND product_option IS NOT NULL) OR
    (service <> 'consulting' AND product_option IS NULL)
  )
);

INSERT INTO sysvexa_service_requests_v2 (
  id, name, email, phone, service, product_option, details, locale,
  status, source, consent_at, created_at
)
SELECT
  id, name, email, phone, service, NULL, details, locale,
  status, source, consent_at, created_at
FROM sysvexa_service_requests;

DROP TABLE sysvexa_service_requests;
ALTER TABLE sysvexa_service_requests_v2 RENAME TO sysvexa_service_requests;

CREATE INDEX sysvexa_service_requests_status_created_idx
  ON sysvexa_service_requests (status, created_at DESC);

CREATE INDEX sysvexa_service_requests_email_created_idx
  ON sysvexa_service_requests (email, created_at DESC);
