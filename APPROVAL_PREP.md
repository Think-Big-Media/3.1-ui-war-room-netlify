# API Approval Preparation - War Room (Think Big Media)

## Meta (Facebook) App Review

- Connect to Facebook OAuth flow screenshot: add here (Settings → Platform Integrations → "Connect to Facebook").
- Redirect URI (local dev): `http://localhost:5173/auth/facebook/callback`
- Redirect URI (backend callback used by API): `http://localhost:8000/api/v1/auth/meta/callback` (production: `https://war-room-oa9t.onrender.com/api/v1/auth/meta/callback`)
- Required permissions:
  - `ads_read`: read campaign performance and insights
  - `ads_management`: manage ad accounts for automated operations (optional if read-only)
- Use case description:
  - War Room ingests Facebook Ads performance (campaigns, ad sets, ads) to power a unified analytics dashboard and alerting. Data is read to show KPIs, trends, and anomaly alerts, and optionally to apply recommended optimizations with user approval.

## Google Ads API Approval

- Google Ads API Center: ensure Developer Details reflect Think Big Media
  - Company name: Think Big Media
  - Contact email (role-based): `api@thinkbigmedia.com`
- OAuth2 flow
  - Redirect URI (backend): `https://war-room-oa9t.onrender.com/api/v1/auth/google-ads/callback` (dev: `http://localhost:8000/api/v1/auth/google-ads/callback`)
  - Scope usage: read performance data to populate analytics dashboards; optional mutate endpoints for managed optimization features
- Use case description:
  - War Room consolidates ads performance from Google Ads to provide a cross-platform dashboard, pacing alerts, and performance insights. Primary operations are read-only queries; limited write operations may be used for bulk pausing or budget adjustments with explicit user action.

## Screenshots Checklist

- Facebook OAuth: consent screen and successful callback
- Google OAuth: consent screen and successful callback
- In-app integrations page showing accounts connected and healthy

## Required Permissions and Scopes

- Facebook: `ads_read`, `ads_management` (as applicable)
- Google Ads: standard Google Ads API scopes for read (and write if needed); document exact scope strings when configured

## Redirect URIs and Endpoints

- Facebook
  - Frontend local: `http://localhost:5173/auth/facebook/callback`
  - Backend dev: `http://localhost:8000/api/v1/auth/meta/callback`
  - Backend prod: `https://war-room-oa9t.onrender.com/api/v1/auth/meta/callback`
- Google Ads
  - Backend dev: `http://localhost:8000/api/v1/auth/google-ads/callback`
  - Backend prod: `https://war-room-oa9t.onrender.com/api/v1/auth/google-ads/callback`

## Company Information (Think Big Media)

- Legal/Operating name: Think Big Media
- Website: https://wethinkbig.io
- Contact email: `api@thinkbigmedia.com`
- Purpose: Marketing technology platform providing unified campaign analytics and operational tooling for political and advocacy campaigns.

## Notes

- Ensure privacy policy and terms are published and linked in the app configuration.
- Ensure test user accounts are provisioned for reviewers.
- Provide screencast links demonstrating end-to-end OAuth and data retrieval.
