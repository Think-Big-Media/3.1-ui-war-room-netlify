#!/usr/bin/env bash
set -euo pipefail

# verify-render-deployment.sh
# Verifies GitHub/Render deployment configuration for War Room
# - Confirms required secrets/variables are present
# - Validates the Render account and service ID
# - Checks URL/service ID mappings

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

info() { echo -e "${YELLOW}➤${NC} $*"; }
ok() { echo -e "${GREEN}✓${NC} $*"; }
fail() { echo -e "${RED}✗${NC} $*"; exit 1; }
warn() { echo -e "${YELLOW}!${NC} $*"; }

# Config
EXPECTED_SERVICE_ID="srv-d1ub5iumcj7s73ebrpo0"
EXPECTED_URL="https://war-room-oa9t.onrender.com"

info "Checking environment variables (local or CI)…"
MISSING=()

# Variables can come from the environment or .env files loaded by CI.
: "${RENDER_SERVICE_ID:=${RENDER_SERVICE_ID:-}}"
: "${RENDER_API_KEY:=${RENDER_API_KEY:-}}"
: "${RENDER_DEPLOY_HOOK_URL:=${RENDER_DEPLOY_HOOK_URL:-}}"

if [[ -z "${RENDER_SERVICE_ID:-}" ]]; then MISSING+=(RENDER_SERVICE_ID); fi
if [[ -z "${RENDER_API_KEY:-}" && -z "${RENDER_DEPLOY_HOOK_URL:-}" ]]; then
  warn "Neither RENDER_API_KEY nor RENDER_DEPLOY_HOOK_URL is set; at least one is required to trigger deployments"
  MISSING+=(RENDER_API_KEY_or_RENDER_DEPLOY_HOOK_URL)
fi

if [[ ${#MISSING[@]} -gt 0 ]]; then
  warn "Missing variables: ${MISSING[*]}"
else
  ok "Required variables are present"
fi

info "Validating service target…"
if [[ -z "${RENDER_SERVICE_ID:-}" ]]; then
  fail "RENDER_SERVICE_ID is not set; expected ${EXPECTED_SERVICE_ID}"
fi

if [[ "${RENDER_SERVICE_ID}" != "${EXPECTED_SERVICE_ID}" ]]; then
  warn "RENDER_SERVICE_ID=${RENDER_SERVICE_ID} does not match expected ${EXPECTED_SERVICE_ID}"
else
  ok "Service ID matches expected (${EXPECTED_SERVICE_ID})"
fi

# If API key available, verify service exists in this Render account
if [[ -n "${RENDER_API_KEY:-}" ]]; then
  info "Checking Render API access and service ownership…"
  HTTP_STATUS=$(curl -s -o /tmp/render_service.json -w "%{http_code}" \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    "https://api.render.com/v1/services/${RENDER_SERVICE_ID}" || true)

  if [[ "${HTTP_STATUS}" == "200" ]]; then
    NAME=$(jq -r '.name // empty' /tmp/render_service.json 2>/dev/null || true)
    if [[ -n "${NAME}" ]]; then
      ok "Service found in this account: ${NAME} (${RENDER_SERVICE_ID})"
    else
      ok "Service found (${RENDER_SERVICE_ID})"
    fi
  elif [[ "${HTTP_STATUS}" == "404" ]]; then
    fail "Service not found in this Render account for ID ${RENDER_SERVICE_ID}. Check API key/account."
  else
    warn "Unexpected status (${HTTP_STATUS}) from Render API while fetching service"
    cat /tmp/render_service.json || true
  fi
else
  info "Skipping API ownership check (RENDER_API_KEY not set)"
fi

info "Validating URL mapping…"
if curl -s -o /dev/null -w "%{http_code}" "${EXPECTED_URL}/health" | grep -q "^200$"; then
  ok "Live URL is healthy: ${EXPECTED_URL}"
else
  warn "Live URL not responding 200: ${EXPECTED_URL}/health"
fi

echo
ok "Render deployment verification completed"
