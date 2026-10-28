-- 009: ISO 9001:2026 QMS preparation. Additive, entirely separate from certification claims.
-- Demo fixtures provide examples, never evidence that physical work or independent audits occurred.
CREATE TABLE IF NOT EXISTS ttc_qms_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 code text NOT NULL UNIQUE CHECK(code ~ '^QMS-[A-Z0-9-]{3,55}$'),
 title text NOT NULL CHECK(length(title) BETWEEN 5 AND 160),
 kind text NOT NULL CHECK(kind IN ('policy','scope','procedure','work_instruction','form','register')),
 body text NOT NULL CHECK(length(body) BETWEEN 20 AND 12000),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','in_review','approved','obsolete')),
 owner_id uuid REFERENCES ttc_users(id),
 approved_by uuid REFERENCES ttc_users(id),
 approved_at timestamptz,
 demo boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT qms_approved_identity CHECK(status <> 'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS ttc_qms_document_history (
 id bigserial PRIMARY KEY,
 document_id uuid NOT NULL REFERENCES ttc_qms_documents(id),
 version integer NOT NULL,
 status text NOT NULL,
 body text NOT NULL,
 actor_id uuid REFERENCES ttc_users(id),
 reason text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS qms_doc_history_idx ON ttc_qms_document_history(document_id,created_at DESC);
CREATE TABLE IF NOT EXISTS ttc_qms_issues (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 reference text NOT NULL UNIQUE CHECK(reference ~ '^QMS-[A-Z]+-[0-9A-F]{10}$'),
 kind text NOT NULL CHECK(kind IN ('risk','opportunity','nonconformity','customer_complaint','corrective_action')),
 title text NOT NULL CHECK(length(title) BETWEEN 5 AND 160),
 description text NOT NULL CHECK(length(description) BETWEEN 15 AND 2400),
 severity text NOT NULL DEFAULT 'medium' CHECK(severity IN ('low','medium','high')),
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','verification','closed')),
 order_no text,
 root_cause text NOT NULL DEFAULT '',
 action_plan text NOT NULL DEFAULT '',
 effectiveness_check text NOT NULL DEFAULT '',
 owner_id uuid REFERENCES ttc_users(id),
 closed_by uuid REFERENCES ttc_users(id),
 closed_at timestamptz,
 demo boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT qms_closed_verification CHECK(status <> 'closed' OR
 (closed_by IS NOT NULL AND closed_at IS NOT NULL AND length(effectiveness_check)>=15))
);
CREATE INDEX IF NOT EXISTS qms_issue_index ON ttc_qms_issues(status,kind,created_at DESC);
CREATE TABLE IF NOT EXISTS ttc_qms_issue_history (
 id bigserial PRIMARY KEY,
 issue_id uuid NOT NULL REFERENCES ttc_qms_issues(id),
 actor_id uuid REFERENCES ttc_users(id),
 status text NOT NULL,
 note text NOT NULL CHECK(length(note)>0),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS qms_issue_history_idx ON ttc_qms_issue_history(issue_id,created_at DESC);
CREATE TABLE IF NOT EXISTS ttc_qms_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 reference text NOT NULL UNIQUE CHECK(reference ~ '^QMS-REC-[0-9A-F]{12}$'),
 kind text NOT NULL CHECK(kind IN ('requirements_review','supplier_evaluation','incoming_inspection',
 'in_process_inspection','final_inspection','competence','internal_audit','management_review',
 'customer_feedback','change_control','quality_objective','climate_context_review')),
 title text NOT NULL CHECK(length(title) BETWEEN 5 AND 160),
 details text NOT NULL CHECK(length(details) BETWEEN 20 AND 3500),
 result text NOT NULL CHECK(result IN ('pass','fail','follow_up','not_applicable')),
 order_no text,
 supplier_code text,
 evidence_ref text NOT NULL DEFAULT '',
 actor_id uuid REFERENCES ttc_users(id),
 demo boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS qms_record_filter_idx ON ttc_qms_records(kind,created_at DESC);
CREATE INDEX IF NOT EXISTS qms_release_check_idx ON ttc_qms_records(order_no,kind,created_at DESC);
-- Seed an initial register as DRAFT; none of these texts are approved, implemented or audited policies.
INSERT INTO ttc_qms_documents(code,title,kind,body,demo) VALUES
('QMS-POL-001','Quality policy — illustrative draft','policy',
'PRELIMINARY DEMO DRAFT. Management must validate scope, customer obligations and the organization\'s strategic direction, approve and communicate an authentic quality policy. Proposed intent: documented garment requirements, review of orders and samples, controlled suppliers and production processes, competent personnel, consistent inspections, customer feedback and continual improvement. This is not a declaration of compliance or certification.',true),
('QMS-SCP-001','Quality management system scope — draft','scope',
'PRELIMINARY DEMO DRAFT. Proposed scope for leadership validation: design coordination, materials procurement, order planning, garment production, verification and dispatch for institutional uniforms and custom apparel in Taytay, Rizal. Confirm all physical sites, outsourced operations, products and applicable clauses with the actual legal entity. No certification scope has been issued.',true),
('QMS-WI-001','Garment acceptance and final inspection — draft','work_instruction',
'PRELIMINARY DEMO DRAFT. For each approved customer specification: retain signed sample and requirements, check size and construction against the controlled spec, validate trims and finishes, record defects and dispositions, maintain batch identity and authorize release only after a passing final inspection. Define approved sampling plans and calibrated measuring resources before production.',true),
('QMS-PRO-001','Supplier qualification and receiving — draft','procedure',
'PRELIMINARY DEMO DRAFT. Define supplier criteria, fabric and trim acceptance tests, purchase-order specification approval, traceability to supplier lots, delivery inspection and disposition of rejected materials. Supplier ratings should be based on actual measured quality, delivery and complaints, with periodic re-evaluation.',true),
('QMS-PRO-002','Complaints, nonconformity and corrective action — draft','procedure',
'PRELIMINARY DEMO DRAFT. Capture defects or complaints, contain affected lots, protect the customer, assess root causes, implement corrective actions, verify sustained effectiveness and record authorized closure. Maintain an exception log and escalate serious customer or worker safety risks. Do not mark a complaint closed based only on an action promise.',true)
ON CONFLICT(code) DO NOTHING;
-- Fictional scenarios for demos. These are pending review, not actual operational incidents.
INSERT INTO ttc_qms_issues(reference,kind,title,description,severity,status,demo)
VALUES
('QMS-RISK-A001B2C3D4','risk','DEMO — dye-lot color variation',
'Fictional scenario: repeat fabric batches may differ visually; define incoming shade checks, control samples and approved customer tolerance before cutting.','medium','open',true),
('QMS-OPP-E001B2C3D4','opportunity','DEMO — fabric cutting waste reduction',
'Fictional improvement idea: test a marker-layout optimization to reduce material offcuts; document baseline, target and pilot before reporting results.','low','open',true),
('QMS-NC-F001B2C3D4','nonconformity','DEMO — stitching alignment variance',
'Fictional exercise: an imaginary garment sample failed an agreed seam-alignment check; establish containment, root cause and corrective-action evidence.','high','open',true)
ON CONFLICT(reference) DO NOTHING;
-- For the public badge directory, update scheme description without asserting earned status.
UPDATE ttc_trust_badges
SET description='ISO 9001:2026 is the current quality management system standard. Registration or certification must be evidenced by a valid independent certification-body certificate, approved scope and reference. The website QMS is under preparation; no certification is claimed.'
WHERE slug='iso9001' AND status='research';
