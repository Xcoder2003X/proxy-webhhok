CREATE TYPE endpoint_provider AS ENUM ('stripe', 'github', 'shopify', 'generic');
CREATE TYPE event_status AS ENUM ('pending', 'delivering', 'delivered', 'failed', 'dead');
CREATE TYPE alert_channel_type AS ENUM ('slack', 'discord');

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  api_key_hash text NOT NULL UNIQUE CHECK (api_key_hash ~ '^[0-9a-f]{64}$'),
  retention_days integer NOT NULL DEFAULT 3 CHECK (retention_days > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[A-Za-z0-9_-]{16,}$'),
  provider endpoint_provider NOT NULL,
  signing_secret_enc bytea NOT NULL,
  generic_header text,
  destination_url text NOT NULL,
  silence_minutes integer CHECK (silence_minutes IS NULL OR silence_minutes > 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, id),
  CHECK (
    (provider = 'generic' AND generic_header IS NOT NULL)
    OR (provider <> 'generic' AND generic_header IS NULL)
  )
);

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  endpoint_id uuid NOT NULL,
  provider_event_id text,
  received_at timestamptz NOT NULL DEFAULT now(),
  method text NOT NULL,
  path text NOT NULL,
  headers jsonb NOT NULL DEFAULT '{}'::jsonb,
  body_enc bytea NOT NULL,
  body_size integer NOT NULL CHECK (body_size >= 0),
  content_type text NOT NULL,
  signature_valid boolean NOT NULL DEFAULT true CHECK (signature_valid),
  status event_status NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  last_error text,
  delivered_at timestamptz,
  replay_count integer NOT NULL DEFAULT 0 CHECK (replay_count >= 0),
  expires_at timestamptz NOT NULL,
  FOREIGN KEY (project_id, endpoint_id)
    REFERENCES endpoints (project_id, id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX events_endpoint_provider_event_id_unique
  ON events (endpoint_id, provider_event_id)
  WHERE provider_event_id IS NOT NULL;
CREATE INDEX events_delivery_queue_idx
  ON events (status, next_attempt_at)
  WHERE status IN ('pending', 'delivering');
CREATE INDEX events_project_received_idx
  ON events (project_id, received_at DESC, id DESC);
CREATE INDEX events_expires_idx ON events (expires_at);

CREATE TABLE delivery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  attempt_no integer NOT NULL CHECK (attempt_no > 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  duration_ms integer CHECK (duration_ms IS NULL OR duration_ms >= 0),
  response_status integer CHECK (response_status IS NULL OR response_status BETWEEN 100 AND 599),
  error text,
  response_snippet text CHECK (
    response_snippet IS NULL OR octet_length(response_snippet) <= 1024
  ),
  UNIQUE (event_id, attempt_no)
);

CREATE TABLE alert_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  type alert_channel_type NOT NULL,
  config_enc bytea NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE alert_state (
  key text PRIMARY KEY,
  last_sent_at timestamptz NOT NULL
);
