# Multi-function client demo — Taytay Textile Co. (2026-10-28)

This is a development demonstration with **fictional data**. None of the listed production orders or job positions are real.

## Canonical site and portal

- Site: https://taytaygarments.arjayb-fb.workers.dev/
- Taytay garments industry: https://taytaygarments.arjayb-fb.workers.dev/#/taytay-hub
- Careers: https://taytaygarments.arjayb-fb.workers.dev/#/careers
- Portal: https://taytaygarments.arjayb-fb.workers.dev/portal.html
- Old `/admin.html` redirects to the portal. Bearer-only administration has been disabled.

## Accounts seeded in existing Neon

| Role | Email | Access |
| --- | --- | --- |
| Customer | client.demo@taytay.invalid | Only owned orders, order event timeline |
| Staff | staff.demo@taytay.invalid | Orders, stock, procurement, warehouse receipts |
| Administrator | admin.demo@taytay.invalid | Staff approval, orders, purchasing authorization, inventory, audit |
| Webmaster | webmaster.demo@taytay.invalid | Edit/publish approved website sections; cannot access staff/order records |
| Pending staff | pending.staff@taytay.invalid | No dashboard until explicitly approved by administrator |

**Credentials are NOT committed.** The project owner received the independent random passwords in the private conversation. The demo email domains are intentionally invalid and cannot receive mail.

## Suggested client walkthrough

1. Open Taytay Hub: show the official recognition and DTI source links (figures describe the town, not the company).
2. Open Careers: display three **sample** jobs; there is no live application or recruitment claim.
3. Sign in as customer: four fictional orders and their status events. The status timeline is tied to that customer's ID.
4. Sign in as staff: inspect 10 stocked SKUs, reorder alerts, post a demo stock movement, review purchase orders, and show the ledger.
5. Sign in as administrator: see one staff application pending, approve it, issue a draft PO, then inspect administrative activity.
6. Sign in as webmaster: edit the Taytay Hub or Careers content section. Confirm edits remain text-only and do not grant other privileges.
7. Use a staff account to receive against an issued demo purchase order. The PO line, stock count and ledger change together; excess receipts are rejected.

## Launch gates

- Cloudflare Worker must have `DATABASE_URL` for the existing Neon database (latest readiness check may still fail until configured).
- Set `IP_HASH_PEPPER` as an encrypted Worker secret.
- Implement verified email onboarding, MFA/SSO for administrative roles, account recovery, data retention/privacy notice, monitoring and approved recruitment flow before public production use.
- The current site is `noindex`; business name and operating claims need client confirmation.
- IMS is a **functional client-demo core** with catalog, warehouse quantities, stock movements, reorder flags, suppliers, purchasing and orders. It is not an audited ERP, accounting ledger, HRIS, payroll system or live payment system.
