# War Room Service Login Guide

## 🔐 Quick Access Links & Login Information

### 1. Sourcegraph (Code Intelligence)
- **Login URL**: https://sourcegraph.com/sign-in
- **Email**: roderica@warroom.ai
- **Token Page**: https://sourcegraph.com/user/settings/tokens
- **Cursor Integration**: Settings → Extensions → Sourcegraph → Access Token
- **Status**: ✅ MCP Connected, Token in config

### 2. Linear (Task Management)
- **Login URL**: https://linear.app/login
- **Email**: roderica@warroom.ai
- **Organization**: Think-Big-Media
- **API Key Page**: https://linear.app/think-big-media/settings/api
- **Status**: ✅ Configuration exists

### 3. TestSprite (24/7 Monitoring)
- **Login URL**: https://testsprite.com/login
- **Email**: roderica@warroom.ai
- **Dashboard**: https://testsprite.com/dashboard
- **API Key**: https://testsprite.com/dashboard/settings
- **Project**: War Room
- **Status**: ✅ MCP Connected, Config exists

### 4. CodeRabbit (AI PR Reviews)
- **Login URL**: https://app.coderabbit.ai/login
- **Auth Method**: GitHub OAuth
- **Organization**: Think-Big-Media
- **Settings**: https://app.coderabbit.ai/settings
- **Status**: ✅ Configuration exists

### 5. AMP (AI Coding Assistant)
- **Location**: Cursor IDE
- **Activation**: Click AMP icon in Cursor
- **Login**: Use Sourcegraph credentials
- **Features**: Autonomous coding, AI autocomplete
- **Status**: ✅ Installed in Cursor

## 🛠️ MCP Service Status

### Currently Connected:
- ✅ GitHub MCP
- ✅ TestSprite MCP
- ✅ Perplexity MCP (installed, API key in config)
- ✅ Notion MCP
- ✅ Render MCP
- ✅ Sourcegraph React Prop MCP
- ✅ Context Engineering MCP
- ✅ IDE (VS Code) MCP

## 📋 Required Actions

1. **Restart Claude Desktop** to reload MCP configuration
2. **Add to GitHub Secrets** (if not already done):
   - `TESTSPRITE_API_KEY`
   - `TESTSPRITE_PROJECT_ID`
   - `LINEAR_API_KEY`
   - `SOURCEGRAPH_TOKEN`

## 🚀 Production Site
- **URL**: https://war-room-oa9t.onrender.com
- **Status**: ✅ Live and healthy
- **Monitoring**: TestSprite 24/7

## 🎯 Everything is Ready!
All services are configured and ready to use. The MCP connections will be active after restarting Claude Desktop.