# MCP Tools Setup Guide

## Overview
This guide covers setup for three critical paid MCP services:
- **CodeRabbit**: AI-powered code reviews
- **Pieces**: Code snippet management and AI assistance  
- **AMP**: Advanced AI coding assistance in Cursor

## Quick Start

1. **Run the fix script:**
   ```bash
   ./scripts/fix-mcp-connections.sh
   ```

2. **Get API keys:**
   - CodeRabbit: https://app.coderabbit.ai/settings/api-keys
   - Pieces: Automatic (local app)
   - AMP: Built into Cursor

3. **Restart Cursor**

## Manual Configuration

### CodeRabbit Setup
1. Visit https://app.coderabbit.ai/
2. Sign in with GitHub
3. Go to Settings → API Keys
4. Generate new API key
5. Add to `.env.mcp`: `CODERABBIT_API_KEY=your_key_here`

### Pieces Setup  
1. Download Pieces from https://pieces.app/
2. Install and launch the app
3. Pieces runs locally on http://localhost:1000
4. No API key required

### AMP Setup
1. AMP is built into Cursor
2. Open Cursor → View → Command Palette
3. Search for "AMP" 
4. Follow setup prompts

## Verification

Run the verification script:
```bash
./scripts/verify-mcp-tools.sh
```

## Troubleshooting

### CodeRabbit Issues
- Ensure API key is valid
- Check network connectivity
- Restart Cursor

### Pieces Issues  
- Ensure Pieces app is running
- Check port 1000 is not blocked
- Restart Pieces app

### AMP Issues
- Update Cursor to latest version
- Check account permissions
- Clear Cursor cache

## Configuration Files

- Cursor Settings: `~/Library/Application Support/Cursor/User/settings.json`
- Environment: `.env.mcp`
- MCP Config: `~/.claude/claude_desktop_config.json`

## Support

- CodeRabbit: https://docs.coderabbit.ai/
- Pieces: https://docs.pieces.app/
- AMP: Built into Cursor documentation
