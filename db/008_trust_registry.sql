-- 008: add an evidence-first public badge registry without conferring certification.
CREATE TABLE IF NOT EXISTS ttc_trust_badges (
 slug text PRIMARY KEY CHECK(slug ~ '^[a-z0-9-]+$'),
 title text NOT NULL, category text NOT NULL, issuer text NOT NULL,
 description text NOT NULL, source_url text NOT NULL,
 proof_kind text NOT NULL CHECK(proof_kind IN ('registration','membership','assessment','audit','certification','program','test-report')),
 status text NOT NULL DEFAULT 'research' CHECK(status IN ('research','submitted','documented','withdrawn')),
 certificate_ref text NOT NULL DEFAULT '',
 verification_url text NOT NULL DEFAULT '',
 valid_until date,
 review_note text NOT NULL DEFAULT '',
 reviewed_by uuid REFERENCES ttc_users(id),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ttc_trust_badges_category_idx ON ttc_trust_badges(category,slug);
CREATE INDEX IF NOT EXISTS ttc_trust_badges_status_idx ON ttc_trust_badges(status);
INSERT INTO ttc_trust_badges (slug,title,category,issuer,description,source_url,proof_kind) VALUES
('bir','BIR Registration','Philippine legitimacy','Bureau of Internal Revenue','Registration documentation and tax filing information; no compliance seal is asserted.','https://www.bir.gov.ph/','registration'),
('business-permit','DTI / LGU Business Registration','Philippine legitimacy','DTI / Local Government Unit','Check registered business name, permit and operating scope; export permissions are separate.','https://negosyokonek.dti.gov.ph/','registration'),
('dole','DOLE Labor Standards','Philippine legitimacy','Department of Labor and Employment','Inspection and labor documentation review; do not represent as a government-issued 100% compliance seal.','https://bwc.dole.gov.ph/our-programs-and-services/labor-inspection/','assessment'),
('benefits','SSS / PhilHealth / Pag-IBIG','Philippine legitimacy','Philippine statutory employee benefit agencies','Employee remittance records subject to confidential document verification.','https://www.sss.gov.ph/','assessment'),
('philgeps','PhilGEPS Platinum','Philippine legitimacy','Philippine Government Electronic Procurement System','Valid Platinum membership requires a current certificate and eligibility documents.','https://notices.philgeps.gov.ph/help1_5.html','membership'),
('ph-trustmark','DTI Philippine Trustmark','Philippine legitimacy','Department of Trade and Industry','DTI e-commerce trustmark requires an issued QR-linked registration for this site.','https://trustmark.dti.gov.ph/','certification'),
('philexport','PHILEXPORT Membership','Trade associations','Philippine Exporters Confederation','Membership status, not proof of customs clearance or export accreditation.','https://philexport.ph/philexport-membership/','membership'),
('conwep','CONWEP Membership','Trade associations','Confederation of Wearables Exporters of the Philippines','Industry association membership subject to confirmation with the organization.','https://conwep.org/','membership'),
('pcci','PCCI Chapter Membership','Trade associations','Philippine Chamber of Commerce and Industry','Regional chapter membership subject to current registry proof.','https://www.philippinechamber.com/','membership'),
('wrap','WRAP Certification','Ethical production','Worldwide Responsible Accredited Production','Facility-level, valid certification; logo use limited to qualifying facilities.','https://wrapcompliance.org/en/certification/','certification'),
('smeta','Sedex / SMETA Audit','Ethical production','Sedex','SMETA is an audit methodology, not a certification or pass/fail result.','https://www.sedex.com/what-we-do-at-sedex/','audit'),
('sa8000','SA8000 Certification','Ethical production','Social Accountability International','Facility social-accountability certification, subject to valid audit and certificate.','https://sa-intl.org/programs/sa8000/','certification'),
('bsci','amfori BSCI Assessment','Ethical production','amfori','Social compliance assessment; avoid describing a BSCI audit as formal factory certification.','https://www.amfori.org/','assessment'),
('gots','GOTS','Materials & traceability','Global Standard gGmbH','Certified scope and transaction records required before product claims or logo use.','https://global-standard.org/','certification'),
('grs','Global Recycled Standard','Materials & traceability','Textile Exchange','Recycled-content certification and traceability evidence apply to relevant supply chain and articles.','https://textileexchange.org/','certification'),
('ocs','Organic Content Standard','Materials & traceability','Textile Exchange','Organic content chain-of-custody certification and product-scoped documentation.','https://textileexchange.org/','certification'),
('rcs','Recycled Claim Standard','Materials & traceability','Textile Exchange','Recycled content chain-of-custody certification and product-scoped documentation.','https://textileexchange.org/','certification'),
('oekotex','OEKO-TEX STANDARD 100','Safety & quality','OEKO-TEX Association','Product/component certificate must include the exact item and valid label-check number.','https://www.oeko-tex.com/en/our-standards/oeko-tex-standard-100','certification'),
('bluesign','bluesign','Safety & quality','bluesign technologies','Approved partner/product claims and trademarks require valid authorization.','https://www.bluesign.com/','certification'),
('iso9001','ISO 9001 Quality Management','Safety & quality','Independent ISO 9001 certification body','Evidence comes from a certification body; ISO does not certify businesses or license its logo.','https://www.iso.org/certification.html','certification'),
('ctpat','CTPAT Trade Security','Safety & quality','U.S. Customs and Border Protection','Partnership participation requires government recognition; facility status is not implied.','https://www.cbp.gov/border-security/ports-entry/cargo-security/ctpat','program'),
('testing','SGS / Intertek Test Reports','Safety & quality','Independent testing provider','Specific batch or product testing is evidenced by a report; no universal certified-factory claim.','https://www.sgs.com/','test-report')
ON CONFLICT(slug) DO NOTHING;
