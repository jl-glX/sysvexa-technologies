CREATE TABLE IF NOT EXISTS sysvexa_service_requests (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL,
  email varchar(254) NOT NULL,
  phone varchar(40),
  service varchar(32) NOT NULL CHECK (
    service IN ('maintenance', 'computers', 'networks', 'security')
  ),
  details varchar(4000) NOT NULL,
  locale varchar(20) NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'contacted', 'in_progress', 'closed')
  ),
  source varchar(24) NOT NULL DEFAULT 'website',
  consent_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sysvexa_service_requests_status_created_idx
  ON sysvexa_service_requests (status, created_at DESC);
