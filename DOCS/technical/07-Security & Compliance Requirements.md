# 07-Security & Compliance Requirements - SOC-2 readiness & political data protection [VALIDATED & ENHANCED ✅]

## 07-security-compliance-requirements.md

*War Room • Security & Compliance Requirements*

Version 1.0 • 03 Jul 2025

---

## 1. Security Framework & Standards

| Standard | Scope | Implementation |
| --- | --- | --- |
| **NIST Cybersecurity Framework (CSF 1.1)** | Overall governance; Identify-Protect-Detect-Respond-Recover | Controls mapped in this document |
| **OWASP ASVS v4 Level 1-2** | Web application controls | Automated dependency scans, ZAP baseline, code review checklist |
| **OWASP Top-10** | Prevent common web vulns | Part of CI pipeline gates |
| **SOC 2 Type II (Vendor)** | Supabase, Vercel, Pinecone, OpenAI | Vendor attestation reviewed annually |

---

## 2. Data Protection & Privacy Requirements

1. **Data minimisation:** collect only data necessary for campaign operations.
2. **Data residency:** all production data stored in US-hosted zones (Supabase US-East 1, Pinecone `us-central-gcp`).
3. **PII classification:** voter or donor info = *Sensitive*. Stored exclusively in encrypted Postgres tables; never passed to OpenAI.
4. **Retention:** chat logs & metrics ≥ 2 years (FEC record-keeping), voice memos 90 days then auto-archive.
5. **Deletion/Right-to-be-forgotten:** endpoint to purge user & associated records within 30 days of request (CCPA/GDPR).

---

## 3. Authentication & Authorization Security

| Area | Requirement |
| --- | --- |
| Identity provider | Supabase Auth with email/password & magic link; option to federate via Google Workspace. |
| Password policy | Min 12 chars, OWASP zxcvbn score ≥ 3, rate-limited 10 attempts/15 min. |
| MFA roadmap | TOTP optional in Phase 2; design DB schema to store `mfa_enabled`. |
| Session security | JWT HS256, 60-min expiry, rolling refresh. Secure, HttpOnly cookies on web. |
| Role-Based Access Control | Roles: `admin`, `member`; enforced via Row-Level Security in Postgres & claims in JWT (`orgId`, `role`). |
| Least privilege | Service keys scoped to single purpose (e.g., Meta read-only). |

---

## 4. Political Data Compliance Requirements

| Regulation / Guideline | Control |
| --- | --- |
| **Federal Election Commission (FEC)** record-keeping (11 CFR 102.9) | Preserve expenditure data & communications for ≥ 2 years; immutable `metrics_meta` and `chat_logs` tables with `updated_at` triggers disabled. |
| **Campaign Finance Disclosure** | Admin export tool to produce CSV/PDF of spend logs on demand. |
| **CCPA / CPRA** (California voters) | Provide Data Subject Access Request (DSAR) flow and deletion endpoint. |
| **GDPR** (EU donors) | Consent checkbox for EU IP addresses; exclude EU PII from AI prompts. |
| **SOC 2 vendor alignment** | Maintain current SOC 2 reports for all managed services. |

---

## 5. Encryption Standards

| Layer | Standard | Implementation |
| --- | --- | --- |
| Data at rest | AES-256-GCM | Supabase Postgres & Storage, Pinecone encrypted volumes |
| Data in transit | TLS 1.2+ / HTTPS | HSTS 1 year, TLS 1.0/1.1 disabled |
| Key management | Supabase Key Mgmt, Vercel Secrets, LangChain credential store | Rotate quarterly; store outside repo |
| Hashing | bcrypt (10 rounds) | Supabase default |

---

## 6. API Security & Rate Limiting

1. All custom endpoints implemented as Supabase Edge Functions with Zod schema validation.
2. **HMAC request signatures** for incoming webhooks (SendGrid, Supabase storage) verified server-side.
3. WAF rules via Vercel: block known bad IPs, country geo-block if requested.
4. **Rate limits** (Supabase rate-limit middleware + Redis):
    - Chat: 30 req/min/user (429 with `Retry-After`).
    - Upload: 10 files/hour/user.
    - Metrics endpoint: cron only; manual call disabled for `member`.
5. **Content Security Policy (CSP):** `default-src 'self'; img-src data:; connect-src https://*.openai.com https://*.pinecone.io`.

---

## 7. Infrastructure Security Requirements

| Component | Control |
| --- | --- |
| **Vercel** | Enforce SSO for project, preview deploys protected with password; environment variables encrypted at rest. |
| **Supabase** | RLS on all tables; disabled public bucket access; daily backups enabled; audit tables read-only. |
| **LangChain** | API key authentication; encrypted agent memory; LangSmith monitoring for audit trail. |
| **Pinecone** | API key scoped per environment; separate dev/prod indexes. |
| **CI/CD** | GitHub Actions OIDC with least-privilege token; required status checks. |
| **Secrets Rotation** | 90-day rotation policy; tracked in Notion “Secrets Calendar”. |

---

## 8. Third-Party Service Security Assessment

| Service | Certification | Risk Level | Mitigation |
| --- | --- | --- | --- |
| Supabase | SOC 2 II, GDPR | Medium | Annual review, DPA signed |
| Vercel | SOC 2 II, ISO 27001 | Medium | Auto TLS, WAF, DPA |
| LangChain/OpenAI | SOC 2 Type II | Medium | No PII in prompts; use IDs only |
| Pinecone | SOC 2 II | Medium | Store only embeddings (no raw text) |
| OpenAI | SOC 2 I, GDPR | High | No voter PII in prompts; pseudonymise |
| Meta Marketing API | n/a | High | Read-only token, min scopes |
| SendGrid | SOC 2 II | Medium | DKIM, SPF, DMARC configured |

---

## 9. Incident Response Procedures

1. **Detection & Alerting**: Critical log events (auth failure spikes, WAF blocks, LangChain agent failures) trigger PagerDuty within 5 min.
2. **Triage Timeline**
    - *T0 + 0–4 h:* Assess severity, assign owner, start incident doc.
    - *T0 + 24 h:* Client notification for confirmed data breach, preliminary RCA.
    - *T0 + 72 h:* Full RCA, mitigation, preventative action list.
3. **Communication Channels**: Slack #incidents (internal), email [security@thinkbigmedia.com](mailto:security@thinkbigmedia.com) (client).
4. **Post-mortem**: Review within 7 days; action items tracked in Notion with owners & deadlines.

---

## 10. Audit Logging & Monitoring

| Source | Logged | Retention | Tool |
| --- | --- | --- | --- |
| Supabase Edge & Postgres | Auth events, queries, policy denials | 2 years | Logflare |
| Vercel | Access logs, WAF events | 90 days | Vercel Analytics |
| LangChain | Agent decisions, workflow traces | 1 year | LangSmith dashboard |
| OpenAI | Token usage per request | 1 year | Supabase `openai_usage` |
| SendGrid | Email events (delivered, bounced) | 1 year | Webhook to `email_events` |

All logs immutable (WORM) and time-synced (NTP).

---

## 11. Backup & Disaster Recovery Security

| Data | Frequency | Storage | Encryption | Restore Target |
| --- | --- | --- | --- | --- |
| Postgres & Storage | Daily snapshot | Supabase cold storage (US-E1) | AES-256 | ≤ 2 h |
| Pinecone vectors | Weekly snapshot | GCP bucket (us-central1) | AES-256 | ≤ 4 h |
| LangChain agents | Daily code backup | GitHub private repo | GitHub AES | ≤ 4 h |
| RPO ≤ 24 h, RTO ≤ 2 h for Postgres; documented runbook `dr-restore.md`. |  |  |  |  |

---

## 12. Penetration Testing & Vulnerability Assessment

| Activity | Tool / Vendor | Frequency |
| --- | --- | --- |
| Automated DAST | OWASP ZAP baseline via GitHub Action | On every PR |
| Dependency Scans | Snyk + npm audit | Daily scheduled |
| Infrastructure Scan | Scout Suite on Vercel & Supabase resources | Quarterly |
| External Penetration Test | Certified third-party firm | 2 weeks pre-launch + annually |
| Social Engineering Drill | Internal phishing simulation | Post-launch Q3 |
| Findings ranked CVSS; P0/P1 must be fixed before go-live; P2 within 30 days; P3 tracked. |  |  |

---

### Sign-Off

Security Owner: **Roderic Andrews** (Lead Dev)

Client CISO/Delegate: **__________**

Date: **/**/2025

*End of Document*

## 13. AI Security Framework & Governance

*Critical AI-specific security controls required for political marketing platform.*

1. **AI Input Sanitization Gateway:** All content must pass through PII detection layer before OpenAI API calls. Automated scanning for voter IDs, SSNs, donor information, and political entity names.
2. **Political Compliance Validation:** Real-time scoring of AI outputs against FEC/campaign finance regulations. Whitelist/blacklist system for political entities in AI prompts.
3. **AI Model Governance:** Version tracking for all AI models, prompt engineering review process, and bias detection pipeline for political content generation.
4. **Prompt Injection Protection:** Input validation against malicious prompts, output filtering for prohibited campaign content, and adversarial content detection.
5. **AI Usage Audit Trails:** Complete logging of AI model interactions, including input sanitization results, compliance scores, and any blocked content attempts.

---

## 14. Real-Time Political Compliance Monitoring

1. **Automated Alert System:** Real-time notifications for political PII detection, unauthorized voter/donor data access, FEC reporting deadlines, and AI-generated prohibited content.
2. **Compliance Scoring Dashboard:** Live political compliance scores for all AI interactions, user access patterns, and campaign finance activities with trending analysis.
3. **Weekly Compliance Reports:** Automated generation of data access patterns by user role, AI usage statistics, vendor security status updates, and incident response metrics.
4. **Campaign Finance Integration:** Direct linking to expenditure tracking systems with automated FEC disclosure preparation and regulatory deadline management.

---

## 15. Enhanced Political Data Validation Workflows

1. **Geo-IP Consent Management:** Automated consent collection for EU IP addresses with GDPR-compliant cookie management and data processing agreement presentation.
2. **Enhanced DSAR Workflow:** Automated Data Subject Access Request processing with 30-day completion tracking, cross-system data discovery, and secure data export capabilities.
3. **Political Entity Classification:** Automated detection and classification of political figures, organizations, and sensitive terms with dynamic updating from FEC databases.
4. **Cross-Border Data Handling:** Clear workflows for EU donor data, international campaign contributions, and multi-jurisdiction compliance requirements.

---

## 16. AI-Specific Incident Response Procedures

1. **AI Model Compromise Detection:** Immediate containment procedures for suspected AI model poisoning, adversarial attacks, or unauthorized model access.
2. **Political Misinformation Response:** Rapid response for AI-generated political misinformation with content takedown procedures and regulatory notification protocols.
3. **AI Bias Incident Handling:** Detection and remediation of political bias in AI outputs with model retraining protocols and bias correction workflows.
4. **Political Data Breach Escalation:** Enhanced escalation for voter/donor data exposure with FEC notification requirements and campaign finance impact assessment.

---

## 17. Implementation Priority Matrix

**Critical security enhancements required before production deployment:**

**Implementation Priority Order:**

1. **🔴 CRITICAL - AI Input Sanitization Gateway:** Week 5 (6 hours) - Must be completed before any AI model deployment
2. **🔴 CRITICAL - Political Compliance Validation:** Week 5 (4 hours) - Required for FEC compliance and campaign finance regulations
3. **🔴 CRITICAL - Enhanced Audit Logging:** Week 5 (4 hours) - AI usage tracking essential for political transparency
4. **🟡 HIGH - Real-time Alert System:** Week 6 (4 hours) - Political PII detection and unauthorized access monitoring
5. **🟡 HIGH - AI-Specific Incident Response:** Week 6 (6 hours) - Rapid response for AI-generated compliance violations
6. **🟢 MEDIUM - Enhanced DSAR Workflow:** Week 7 (4 hours) - Automated data subject access request processing

---

## 18. AI Security Implementation Checklist

**Pre-production deployment requirements:**

- **✅ PII Detection Layer:** Implement automated scanning for SSNs, voter IDs, donor information before OpenAI API calls
- **✅ Political Entity Filtering:** Create whitelist/blacklist system for political figures and organizations
- **✅ AI Output Validation:** Real-time compliance scoring against FEC regulations and campaign finance laws
- **✅ Prompt Injection Protection:** Input validation against malicious prompts and adversarial content generation
- **✅ AI Usage Audit Trails:** Complete logging of all AI interactions with input sanitization and compliance scores

---

## 19. Production Readiness Criteria

**The following criteria must be met before production deployment:**

1. **🎯 Zero Political PII Leaks:** AI input sanitization must demonstrate 100% detection rate for political PII in testing environment
2. **🎯 Real-time Compliance Monitoring:** Automated alerts for political data access and AI compliance violations functional
3. **🎯 Incident Response Testing:** AI-specific incident scenarios tested with <5 minute detection time verified
4. **🎯 Vendor Security Validation:** Current SOC 2 Type II attestations confirmed for all third-party services including OpenAI
5. **🎯 Political Penetration Testing:** Security assessment focused on AI model vulnerabilities and political data exposure completed

---

**UPDATED: Document enhanced with critical AI security requirements** *| Version 1.1 • 07 Jul 2025*