# 06-Testing & QA Plan - Quality assurance and testing strategy [VALIDATED ✅]

## 06-testing-qa-plan.md

*War Room • Testing & QA Plan*

Version 1.0 • 03 Jul 2025

---

## 1 Testing Strategy & Approach

| Principle | Implementation |
| --- | --- |
| **Shift-Left** | Write tests as code is written; PR cannot merge without green checks. |
| **AI-Augmented TDD** | Use GPT-4/Copilot to auto-generate unit‐test skeletons; developer reviews & refines. |
| **Risk-Based Prioritisation** | Focus deepest tests on auth, RLS, payments, document ingest & AI prompts. |
| **Pyramid Model** | 60 % unit, 25 % integration, 10 % e2e, 5 % non-functional (perf/sec/access). |
| **Continuous Testing** | GitHub Actions matrix triggers on every push; nightly full regression. |

---

## 2 Test Environments & Data Management

| Env | Purpose | URL | Data Set |
| --- | --- | --- | --- |
| **Local** | Dev + unit/integration | `http://localhost:*` | Seed script inserts demo org + 3 users, redacted PDFs. |
| **CI (GitHub Actions)** | Automated test runner | ephemeral | Docker-compose Supabase, seeded via `scripts/seed-test.sql`. |
| **Staging** | Manual UAT & e2e | `https://staging.warroom.ai` | Masked client data; daily reset. |
| **Production** | Live | `https://app.warroom.ai` | Real data; read-only tests only. |

Data seeding:

```
pnpm db:seed          # local
supabase db reset --linked --seed scripts/seed-test.sql

```

---

## 3 Unit Testing Specifications

| Area | Framework | Coverage Goal |
| --- | --- | --- |
| Edge Functions (Deno) | `supabase-deno-vitest` | 90 % |
| React Components | Vitest + @testing-library/react | 90 % |
| Utility Libraries | Vitest | 95 % |

Example command:

```
pnpm test:unit --coverage

```

AI helper: `npx openai-codetest generate src/chat.ts`.

---

## 4 Integration Testing Requirements

Focus on service boundaries:

1. **Upload → Ingest → Pinecone**
2. **Chat API → GPT-4 → Citations** (OpenAI mocked with fixture)
3. **Meta API Pull → metrics_meta insert** (Meta endpoint mocked)
4. **SendGrid Email Dispatch** (use SendGrid sandbox mode)
Framework: Vitest + Supertest hitting running local server.
DB: Spin up Supabase test instance (`supabase start -x studio`).

Run:

```
pnpm test:int

```

---

## 5 End-to-End Testing Scenarios

Tool: **Playwright Cloud** (headless + visual).

Happy paths automated; edge cases manual checklist.

| ID | Scenario | Steps | Expected |
| --- | --- | --- | --- |
| E2E-01 | Sign-up & Org Creation | open `/signup` → fill form → verify email → create org | Redirect to dashboard; role = admin |
| E2E-02 | Upload PDF & Ask Question | login → upload `policy.pdf` → ask “Summarise section 3” | Response ≤7 s with citation footnote |
| E2E-03 | Voice Memo Insight | record 60 s memo → wait | Transcript + summary displayed |
| E2E-04 | Nightly Digest | cron trigger (simulate) | Email in inbox with metrics table |
| E2E-05 | RLS Escape Attempt | user B tries to GET doc of org A | 403 Forbidden |

Command:

```
pnpm e2e --headed --project=chromium

```

---

## 6 Performance Testing Benchmarks

Tool: **k6** + Playwright traces.

| KPI | Target |
| --- | --- |
| Chat API P95 latency | ≤ 7 s |
| Doc ingest time (25 MB PDF) | ≤ 60 s |
| Concurrent chat streams | 50 users, error < 1 % |
| Peak throughput | 30 req/s sustained 5 min |

Script example `perf/chat-load.js` then:

```
k6 run perf/chat-load.js

```

---

## 7 Security Testing Protocols

| Activity | Tool | Frequency |
| --- | --- | --- |
| Dependency scan | `npm audit`, Snyk | On PR, nightly |
| Static code analysis | CodeQL GitHub Action | On PR |
| Dynamic scan | OWASP ZAP baseline | On PR / staging |
| JWT & RLS verification | Custom Vitest suite | On each push |
| Pen-Test | External vendor | Pre-launch, annual |

Secrets scanning via `gitleaks`. Fail build on high-severity findings.

---

## 8 Accessibility Testing Requirements

- Automated: **axe-core** in Playwright tests (`playwright-axe`).
- Manual: keyboard-only walkthrough, NVDA/VoiceOver screen-reader spot checks.
- **WCAG 2.1 AA** success criteria: colour contrast ≥ 4.5:1, focus indicators, aria-labels.
CI step:

```
pnpm e2e:a11y

```

Fail if serious violations > 0.

---

## 9 Browser & Mobile Compatibility Matrix

| Platform | Min Version | Tested In |
| --- | --- | --- |
| Chrome (Win/Mac) | 113 | Playwright |
| Edge | 113 | Playwright |
| Firefox | 110 | Playwright |
| Safari (macOS) | 15 | BrowserStack manual |
| iOS Safari | 15 | BrowserStack |
| Android Chrome | 110 | BrowserStack |

All critical flows must pass; minor visual quirks tolerated if not blocking.

---

## 10 Bug Reporting & Triage Process

1. **Report** via Notion “Bug Tracker” DB (template).
2. Auto fields: severity (P0–P3), env, steps, screenshot.
3. **Triage meeting** daily 09:30 ET (5 min).
4. SLA:
    - P0 (production down) fix < 24 h
    - P1 (major) < 72 h
    - P2 (minor) next sprint
    - P3 (cosmetic) backlog
5. Tag commit with `fix/#issue-id`; close in PR.

---

## 11 Test Automation Strategy

| Layer | Tool | Trigger |
| --- | --- | --- |
| Unit + Integration | Vitest | `push`, PR |
| E2E + A11y | Playwright | nightly full, PR subset |
| Perf | k6 | weekly, before major merge |
| Security | ZAP, Snyk | PR |
| Coverage upload | Codecov | PR |

GitHub Actions matrix (`.github/workflows/ci.yml`) splits jobs for parallelism. Status checks required before merge to `main`.

---

## 12 Quality Gates & Release Criteria

A release candidate can deploy to **prod** only when:

- [ ]  All unit/integration tests pass.
- [ ]  Code coverage ≥ 85 % lines.
- [ ]  0 open P0 or P1 bugs.
- [ ]  Performance benchmarks met (section 6).
- [ ]  OWASP ZAP scan shows no High/Medium findings.
- [ ]  Accessibility automated scan shows 0 serious violations.
- [ ]  Product Owner signs off UAT in staging.
- [ ]  `version.md` updated and Git tag created (`vX.Y.Z`).

Deployment executed via GitHub Action `deploy-prod` after gate check.

---

### Command Cheat-Sheet

```
# All tests + coverage
pnpm test

# Integration only
pnpm test:int

# Run e2e in headless mode
pnpm e2e

# Accessibility quick check
pnpm e2e:a11y

# Load test chat endpoint
k6 run perf/chat-load.js

```

---

*Responsible:* **Roderic Andrews**

*Last reviewed:* 03 Jul 2025

## 13 AI-Specific Testing Enhancements

Enhanced testing for AI-first development workflow:

- **AI Prompt Effectiveness Testing**: Validate political context accuracy and appropriate responses
- **Hallucination Detection**: Test AI response accuracy for political analysis and fact-checking
- **Political Bias Detection**: Automated validation of AI neutrality in political content analysis

Additional AI testing commands:

```bash
# AI-specific testing commands
pnpm test:ai-prompts          # Validate AI prompt effectiveness
pnpm test:hallucination       # Test AI response accuracy
pnpm test:bias-detection      # Political bias validation
pnpm test:ai-safety           # Content moderation and safety
```

---

## 14 Political Context Test Scenarios

Specialized testing for political marketing platform requirements:

1. **Crisis Response Testing**: Automated tests for breaking political news ingestion and alert generation
2. **Data Source Failover**: Testing for political data feed redundancy (NewsWhip, Mentionlytics backup systems)
3. **Campaign Finance Compliance**: Automated validation of financial data handling and FEC reporting requirements
4. **Real-Time Sentiment Analysis**: Testing sentiment monitoring accuracy during political events and debates
5. **Political Content Moderation**: Validation of content filtering for inappropriate political messaging

Political compliance testing commands:

```bash
# Political compliance-specific testing
pnpm test:fec-compliance      # Federal Election Commission validation
pnpm test:gdpr-political      # EU political data processing tests
pnpm test:content-moderation  # Political content filtering validation
pnpm test:crisis-response     # Breaking news alert system testing
pnpm test:data-feeds          # External political data source reliability
```

---

## 15 Enhanced Performance Testing for Political Context

Additional performance scenarios for political marketing platform:

- **Viral Content Simulation**: Test system under viral political content sharing scenarios (10x normal traffic)
- **Election Day Load Testing**: Simulate traffic spikes during major political events (500+ concurrent users)
- **Real-Time Alert Performance**: Validate notification system performance under political crisis scenarios
- **Multi-Feed Ingestion Testing**: Test simultaneous processing of NewsWhip and Mentionlytics data feeds

**🔍 VALIDATION RESULTS (July 7, 2025)**

✅ STRONG AI-FIRST FOUNDATION: AI-Augmented TDD approach perfect for rapid development workflow

⚙️ COMPREHENSIVE STRATEGY: 60% unit, 25% integration, 10% e2e, 5% non-functional testing distribution ideal

⚠️ POLITICAL MARKETING GAPS: Missing crisis detection, sentiment monitoring, and real-time alert testing scenarios

---

## 16 Streamlined Quality Gates for AI-First Development

Optimized quality criteria for rapid AI-accelerated development cycles:

- [ ]  Reduced Code Coverage: ≥ 70% lines (vs 85%) for AI-generated code with focus on critical paths
- [ ]  Automated Accessibility: Replace manual NVDA/VoiceOver testing with automated accessibility scanning
- [ ]  Risk-Based Security Testing: Focus security testing on political data handling rather than comprehensive coverage
- [ ]  AI Response Quality Gates: All AI prompt tests pass (hallucination, bias, safety checks)
- [ ]  Political Compliance Validation: FEC and GDPR compliance tests pass for data handling

Updated command for streamlined testing:

```bash
# Streamlined quality gate check for AI-first development
pnpm test:ai-quality-gates
# Runs: unit tests (70% coverage), AI safety, political compliance, accessibility
```

**🎯 CRITICAL ADDITIONS NEEDED:**

- E2E-06: Crisis Detection Testing - simulate negative mention spike, verify real-time alert < 60s
- E2E-07: Sentiment Dashboard Accuracy - test with known positive/negative political content samples
- E2E-08: Multi-source Integration - verify NewsWhip + Mentionlytics data aggregation
- E2E-09: Political Data Compliance - test GDPR data deletion + FEC reporting workflows

**👨‍💼 ACTION ITEMS FOR @CARLOS:**

- Coordinate with political monitoring services for TEST API access (sandbox/staging endpoints)
- Provide sample political content datasets for sentiment testing validation
- Set up crisis simulation scenarios with known political events for alert testing

---

## 17 Updated Command Reference - AI-First Development

Enhanced command cheat-sheet with AI-first development and political compliance testing:

```bash
# Core Testing
pnpm test                     # All tests + coverage
pnpm test:int                 # Integration only
pnpm e2e                      # E2E headless mode
pnpm e2e:a11y                 # Accessibility quick check
k6 run perf/chat-load.js      # Load test chat endpoint

# AI-FIRST DEVELOPMENT ADDITIONS
# AI-specific testing
pnpm test:ai-prompts          # Validate AI prompt effectiveness
pnpm test:hallucination       # Test AI response accuracy
pnpm test:bias-detection      # Political bias validation
pnpm test:ai-safety           # Content moderation and safety

# Political compliance
pnpm test:fec-compliance      # Federal Election Commission validation
pnpm test:gdpr-political      # EU political data processing tests
pnpm test:content-moderation  # Political content filtering validation
pnpm test:crisis-response     # Breaking news alert system testing
pnpm test:data-feeds          # External political data source reliability

# Streamlined quality gates
pnpm test:ai-quality-gates    # Complete AI-first development quality check
```