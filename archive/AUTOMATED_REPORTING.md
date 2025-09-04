# Automated Daily Reporting System

## Overview
The War Room project now has automated daily reporting configured through multiple redundant systems to ensure reliable report generation.

## Report Generation Methods

### 1. GitHub Actions (Primary)
**Schedule**: Daily at 9:00 AM EST (2:00 PM UTC)
**File**: `.github/workflows/daily-report.yml`

**Features**:
- Runs on GitHub's infrastructure
- Automatically commits and pushes reports
- Can be manually triggered via workflow_dispatch
- Sends notifications on success/failure

**To manually trigger**:
1. Go to GitHub Actions tab
2. Select "Generate Daily Report" workflow
3. Click "Run workflow"

### 2. Local Cron Job (Backup)
**Schedule**: Daily at 9:00 AM local time
**Script**: `scripts/daily-report-cron.sh`

**Features**:
- Runs on local development machine
- Pulls latest code before generating report
- Commits and pushes to repository
- Sends Apple Watch notifications

**To check status**:
```bash
crontab -l
```

**To manually run**:
```bash
./scripts/daily-report-cron.sh
```

### 3. Python Script (Core)
**File**: `scripts/generate-daily-report.py`

**Features**:
- Analyzes git activity
- Checks test coverage
- Monitors deployment status
- Counts open issues and FIXMEs
- Generates markdown report

**To run manually**:
```bash
python3 scripts/generate-daily-report.py
```

## Report Contents

Each daily report includes:
1. **Executive Summary** - High-level overview
2. **Git Activity** - Commits and file changes
3. **Test Coverage** - Backend and frontend coverage stats
4. **Deployment Status** - Platform deployment health
5. **Open Issues** - TODO files and FIXME comments
6. **Environment Health** - System versions and status
7. **Next Steps** - Recommended actions

## Report Storage

Reports are saved to: `reports/daily/YYYY-MM-DD-daily-report.md`

## Monitoring & Maintenance

### Check Report Generation
```bash
# View latest reports
ls -la reports/daily/

# Check cron logs
ls -la logs/daily-report-*.log

# View GitHub Actions runs
# Visit: https://github.com/Think-Big-Media/1.0-war-room/actions
```

### Troubleshooting

**If reports aren't generating**:
1. Check cron job is active: `crontab -l`
2. Review logs: `cat logs/daily-report-*.log`
3. Test script manually: `./scripts/daily-report-cron.sh`
4. Check GitHub Actions tab for workflow status

**Common issues**:
- Git credentials: Ensure git is configured for automated commits
- Python dependencies: Run `pip install -r requirements.txt`
- Directory permissions: Ensure write access to reports/daily/

## Customization

To modify report content:
1. Edit `scripts/generate-daily-report.py`
2. Test changes with manual run
3. Commit changes to repository

To change schedule:
1. **GitHub Actions**: Edit cron expression in `.github/workflows/daily-report.yml`
2. **Local cron**: Run `crontab -e` and modify the schedule

## Security Notes

- Reports may contain sensitive project information
- Ensure repository access is properly restricted
- GitHub Actions uses repository secrets for sensitive data
- Local cron runs with user permissions

---
*Automated reporting configured on August 2, 2025*