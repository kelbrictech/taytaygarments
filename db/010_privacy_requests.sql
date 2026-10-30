-- 010: Data-subject request intake, evidence and accountable admin review.
-- The user submits a request; no deletion occurs without identity verification and legal review.
CREATE TABLE IF NOT EXISTS ttc_privacy_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 reference text NOT NULL UNIQUE CHECK(reference ~ '^PRIV-[0-9]{4}-[A-F0-9]{12}$'),
 email text NOT NULL CHECK(length(email) BETWEEN 5 AND 150),
 kind text NOT NULL CHECK(kind IN ('access','correction','erasure','objection','withdrawal','portability','complaint')),
 details text NOT NULL DEFAULT '' CHECK(length(details)<=1000),
 status text NOT NULL DEFAULT 'received' CHECK(status IN ('received','reviewing','identity_verification','verified','resolved','declined')),
 review_note text NOT NULL DEFAULT '' CHECK(length(review_note)<=1200),
 identity_verified_at timestamptz,
 resolved_by uuid REFERENCES ttc_users(id),
 resolved_at timestamptz,
 idempotency_key uuid UNIQUE,
 ip_fingerprint text,
 notice_version text NOT NULL DEFAULT '2026-10-30',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT privacy_verified_resolution CHECK(status NOT IN ('resolved','declined') OR (identity_verified_at IS NOT NULL AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL AND length(review_note)>=20))
);
CREATE INDEX IF NOT EXISTS privacy_requests_status_idx ON ttc_privacy_requests(status,created_at DESC);
CREATE INDEX IF NOT EXISTS privacy_requests_email_idx ON ttc_privacy_requests(email,created_at DESC);
CREATE INDEX IF NOT EXISTS privacy_requests_fingerprint_idx ON ttc_privacy_requests(ip_fingerprint,created_at DESC);
CREATE TABLE IF NOT EXISTS ttc_privacy_request_events(
 id bigserial PRIMARY KEY,
 request_id uuid NOT NULL REFERENCES ttc_privacy_requests(id),
 actor_id uuid REFERENCES ttc_users(id),
 status text NOT NULL,
 note text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS privacy_request_events_idx ON ttc_privacy_request_events(request_id,id DESC);
