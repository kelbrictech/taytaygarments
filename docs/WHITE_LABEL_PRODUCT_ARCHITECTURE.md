# White-label product architecture — implementation blueprint

Status: PROPOSED, not implemented. The existing Taytay Garments deployment remains the reference implementation.

## Product objective
Maintain one versioned core application and provide client-specific brand, module, workflow, and data configurations without copying and editing business logic for each customer.

## Verified existing baseline (2026-10-31)
- Cloudflare Worker API in `src/worker.ts`, role-based app API in `src/portal.ts`, and static frontend in `public/`.
- Neon PostgreSQL with `ttc_*` tables, role-based accounts, orders and status event history.
- Cloudflare Workers deployed by connected GitHub build workflow; individual production release still requires verification.
- Project-specific values are embedded in HTML, route labels, database table prefixes, and session cookie names. Multi-client configuration is NOT implemented.

## Recommended initial tenancy model: deployment-per-client
- A single versioned GitHub core package; each client deployment consumes a pinned release.
- Independent Cloudflare Worker routes/domains, secrets, Neon database, and asset namespace per client.
- Per-client configuration files for company identity, contact/legal records, theme tokens, allowed modules, and industry-specific status definitions.
- No production customer credentials or personal data in configuration files.
- Migrations are applied and verified against each client database separately.
- Release rollback is per client; platform release tags and configuration versions are recorded.

## Configuration contract (design sketch, not currently wired)
```json
{
  "clientId": "taytaygarments",
  "brand": {"displayName":"Taytay Textile Co.","logoUrl":null,"primaryColor":"#173e35"},
  "modules": {"orders":true,"inventory":true,"crm":false,"quality":true,"careers":true},
  "orderWorkflow": ["received","sampling","approved","production","quality_check","dispatch","delivered"],
  "locale": "en-PH",
  "currency": "PHP"
}
```
The client ID is an internal deployment identifier, not an authorization boundary; access control remains on server sessions and databases. Workflow status validation must be server-side.

## Implementation sequence
1. Add configuration validation and defaults with the existing Taytay values; test legacy parity.
2. Extract brand labels, colors, links, privacy/legal notices, image URLs, and page navigation into configuration.
3. Introduce module registry with server-side authorization and matching client UI navigation. Never use UI feature flags as access controls.
4. Separate core order state definitions from client-specific transitions and transition permission rules. Preserve immutable order event history.
5. Parameterize database initialization/migrations for independent databases; retain historic ttc_* migration compatibility until explicit migration.
6. Create a second demo client deployment with separate database and domain/route; verify no cross-client data exposure.
7. Add smoke tests for both brands, security/CSRF/session isolation, order tracking, inventory, and migration rollback.
8. Document upgrade path: GitHub release -> staging -> client-by-client deployment -> health/smoke check -> production confirmation.

## Acceptance tests
- One change to the core order tracking engine can be released to both clients without duplicating code.
- Brand changes occur exclusively in client configuration/assets.
- Client A credentials cannot access Client B records, and their database secrets never overlap.
- The client-specific order status workflow is validated by API and shown consistently in UI.
- Existing Taytay flows remain functional and can be rolled back independently.
- A client deployment is labeled live only after real endpoint and database checks succeed.

## Constraints / open decisions
- No assumptions of a shared production tenant database.
- Per-client domains and ownership, billing, onboarding, staff provisioning and client data export/deletion must be designed before commercial launch.
- Existing site is a provisional concept; its branding and legal identity must be independently cleared before reuse.
