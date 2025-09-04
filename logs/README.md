# War Room Logs Directory

This directory contains deployment logs, error traces, and performance metrics for the War Room application.

## Directory Structure

```
logs/
├── deployments/     # Deployment validation and health check logs
├── errors/          # Error logs and stack traces
├── performance/     # Performance metrics and timing logs
└── README.md        # This file
```

## Log Rotation

Logs should be rotated monthly to prevent excessive disk usage. Archive old logs to a backup location.

## Important Files

- `deployments/YYYY-MM-DD-validation.log` - Results of deployment validation scripts
- `errors/YYYY-MM-DD-errors.log` - Any errors encountered during deployment or runtime
- `performance/YYYY-MM-DD-metrics.log` - Performance metrics and response times

## Usage

When debugging deployment issues:
1. Check the latest validation log in `deployments/`
2. Look for any errors in `errors/`
3. Review performance metrics if experiencing slowness

## Note

These logs are for local development reference. Production logs are available in the Render dashboard.