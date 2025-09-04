# ⚠️ IMPORTANT SECURITY NOTE

## API Keys in Configuration Files

Your Claude Desktop configuration contains sensitive API keys. To protect them:

### 1. Never Share Screenshots
- Don't share screenshots of your config files
- API keys can be used to access your accounts

### 2. Rotate Keys Regularly
- GitHub: https://github.com/settings/tokens
- Linear: https://linear.app/settings/api
- Perplexity: https://perplexity.ai/settings/api
- Notion: https://www.notion.so/my-integrations
- Render: https://dashboard.render.com/account/api-keys

### 3. Use Environment Variables (Better Practice)
Instead of hardcoding keys, consider using environment variables:

```bash
# In ~/.zshrc or ~/.bash_profile
export LINEAR_API_KEY="your_key_here"
export GITHUB_TOKEN="your_token_here"
```

### 4. File Permissions
Ensure your config file has restricted permissions:
```bash
chmod 600 "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
```

### 5. Git Safety
These files should NEVER be in git:
- `claude_desktop_config.json`
- Any file containing API keys
- `.env` files with secrets

### If Keys Are Exposed:
1. **Immediately** rotate all API keys
2. Check service logs for unauthorized access
3. Enable 2FA on all services

---
*Your security is important - protect your API keys!*