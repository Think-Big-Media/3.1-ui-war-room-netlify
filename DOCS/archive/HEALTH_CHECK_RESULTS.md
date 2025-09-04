# Health Check Results

Last updated: 2025-08-09T05:55:22Z (UTC)

## Summary
- /health: 200 OK (0.214s)
- /settings: 200 OK (0.215s)
- /api/v1/test: 200 OK (0.592s)
- /api/v1/health: 404 Not Found (0.217s)

## Details
### Primary
```bash
curl -w "status=%{http_code} time=%{time_total}\n" -s https://war-room-oa9t.onrender.com/health
# status=200 time=0.214
```

### Settings page
```bash
curl -w "status=%{http_code} time=%{time_total}\n" -s https://war-room-oa9t.onrender.com/settings
# status=200 time=0.215
```

### API test endpoint
```bash
curl -w "status=%{http_code} time=%{time_total}\n" -s https://war-room-oa9t.onrender.com/api/v1/test
# status=200 time=0.592
```

### API health endpoint
```bash
curl -w "status=%{http_code} time=%{time_total}\n" -s https://war-room-oa9t.onrender.com/api/v1/health
# status=404 time=0.217
```

## Observations
- Backend defines `GET /api/v1/monitoring/health` and other health routes under specific prefixes; there is no `GET /api/v1/health` route.
- Keep-warm workflow should rely on `/health` (root) or `/api/v1/monitoring/health` instead of `/api/v1/health`.

## Recommendations
1. Update any health checks that use `/api/v1/health` to `/health` or `/api/v1/monitoring/health`.
2. Keep `/api/v1/test` as a secondary API liveness probe while backend routes are evolving.
