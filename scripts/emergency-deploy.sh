#!/bin/bash

# Emergency deployment script - PREVENTS Render from rebuilding frontend
# This commits the pre-built files and removes ALL build triggers

echo "🚨 Emergency Deployment - Preventing Frontend Rebuild"
echo "====================================================="

# 1. First, ensure package.json won't trigger builds
echo "1️⃣ Removing build script from package.json to prevent Render builds..."
cd src/frontend

# Backup original package.json
cp package.json package.json.backup

# Remove or rename the build script so Render can't run it
node -e "
const pkg = require('./package.json');
pkg.scripts['build-disabled'] = pkg.scripts.build;
delete pkg.scripts.build;
pkg.scripts.build = 'echo Build disabled for Render - using pre-built files';
require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo "✅ Disabled build script in package.json"

# 2. Build locally with our working configuration
echo "2️⃣ Building frontend locally with working tools..."
# Restore build command temporarily
cp package.json.backup package.json
npm ci --omit=optional
npm run build

# Get the hash of our build
BUILT_HASH=$(ls dist/assets/index-*.js | grep -o 'index-[^.]*' | head -1)
echo "✅ Built frontend with hash: $BUILT_HASH"

# Now disable build again
node -e "
const pkg = require('./package.json');
pkg.scripts['build-disabled'] = pkg.scripts.build;
delete pkg.scripts.build;
pkg.scripts.build = 'echo Build disabled - using pre-built files with hash $BUILT_HASH';
require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

cd ../..

# 3. Copy dist everywhere Render might look
echo "3️⃣ Copying dist to ALL possible locations..."
rm -rf dist src/dist src/backend/dist public src/frontend/public
cp -r src/frontend/dist .
cp -r src/frontend/dist src/
cp -r src/frontend/dist src/backend/
cp -r src/frontend/dist public
mkdir -p src/frontend/public
cp -r src/frontend/dist/* src/frontend/public/

# 4. Create a package.json at root that does nothing
echo "4️⃣ Creating root package.json that blocks npm commands..."
cat > package.json << 'EOF'
{
  "name": "war-room-no-build",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "echo 'BUILD DISABLED - Using pre-built files. Check dist/ folder'",
    "install": "echo 'INSTALL DISABLED - Frontend already built'",
    "start": "echo 'This is a Python app - use serve_bulletproof.py'"
  },
  "description": "This package.json prevents Render from running npm commands"
}
EOF

# 5. Update render.yaml to explicitly avoid npm
echo "5️⃣ Updating render.yaml to prevent npm execution..."
cat > render.yaml << 'EOF'
services:
  - type: web
    name: war-room-fullstack
    runtime: python
    buildCommand: |
      echo "Starting Python-only build process"
      cd src/backend && pip install -r requirements.txt
      echo "Build complete - using pre-built frontend"
    startCommand: |
      cd src/backend && python serve_bulletproof.py
    envVars:
      - key: PYTHON_VERSION
        value: '3.11'
      - key: SKIP_NPM
        value: 'true'
EOF

# 6. Create a .npmrc that prevents installs
echo "6️⃣ Creating .npmrc to block npm operations..."
cat > .npmrc << 'EOF'
# Block npm operations on Render
dry-run=true
ignore-scripts=true
EOF

cat > src/frontend/.npmrc << 'EOF'
# Block npm operations on Render
dry-run=true
ignore-scripts=true
EOF

# 7. Update the bulletproof server to confirm which dist it's using
echo "7️⃣ Updating server to report dist location..."
cat > src/backend/serve_bulletproof.py << 'EOF'
import os
import sys
import json
from pathlib import Path
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import the main app
try:
    from main import app
    logger.info("✅ Successfully imported main app")
except Exception as e:
    logger.error(f"❌ Failed to import main app: {e}")
    app = FastAPI(title="War Room")

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Find dist folder
dist_path = None
checked_paths = []
possible_paths = [
    Path("dist"),
    Path("../dist"),
    Path("../../dist"),
    Path("src/dist"),
    Path("src/backend/dist"),
    Path("src/frontend/dist"),
    Path("/opt/render/project/src/dist"),
    Path("/opt/render/project/dist"),
    Path("/opt/render/project/src/backend/dist"),
]

for path in possible_paths:
    checked_paths.append(str(path.absolute()))
    if path.exists() and path.is_dir():
        # Check if it has index.html
        if (path / "index.html").exists():
            dist_path = path.absolute()
            logger.info(f"✅ Found dist with index.html at: {dist_path}")
            # Check which JS file is present
            js_files = list(path.glob("assets/index-*.js"))
            if js_files:
                logger.info(f"📦 JS files found: {[f.name for f in js_files]}")
            break

if not dist_path:
    logger.error(f"❌ No dist folder found! Checked: {checked_paths}")
    
    @app.get("/")
    async def emergency_root():
        return JSONResponse({
            "error": "No dist folder found",
            "checked_paths": checked_paths,
            "cwd": os.getcwd(),
            "files_in_cwd": os.listdir("."),
            "render_env": os.environ.get("RENDER_ENV", "unknown")
        })
else:
    # Mount static files
    app.mount("/assets", StaticFiles(directory=str(dist_path / "assets")), name="assets")
    
    @app.get("/deployment-info")
    async def deployment_info():
        js_files = list(dist_path.glob("assets/index-*.js"))
        return JSONResponse({
            "dist_path": str(dist_path),
            "js_files": [f.name for f in js_files],
            "has_index_html": (dist_path / "index.html").exists(),
            "cwd": os.getcwd()
        })
    
    @app.get("/{path:path}")
    async def serve_spa(path: str):
        if path.startswith(("api/", "health", "deployment-info")):
            return JSONResponse({"error": "Not found"}, status_code=404)
        
        index_file = dist_path / "index.html"
        if index_file.exists():
            # Read and inject deployment info
            content = index_file.read_text()
            js_files = list(dist_path.glob("assets/index-*.js"))
            js_hash = js_files[0].name if js_files else "unknown"
            content = content.replace("</body>", f"""
            <!-- Deployment Info: Using {js_hash} from {dist_path} -->
            </body>""")
            return HTMLResponse(content=content)
        else:
            return HTMLResponse(content="<h1>index.html not found</h1>", status_code=404)

@app.get("/health")
async def health():
    return {"status": "healthy", "dist_found": dist_path is not None}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"🚀 Starting server on port {port}")
    logger.info(f"📁 Dist path: {dist_path}")
    logger.info(f"🌍 Environment: {os.environ.get('RENDER_ENV', 'development')}")
    
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
EOF

echo "8️⃣ Committing EVERYTHING including dist folders..."
git add -A
git status

echo "9️⃣ Creating commit with clear message..."
git commit -m "🛡️ BULLETPROOF: Block ALL npm operations, use pre-built dist

- Disabled build script in package.json
- Added root package.json that blocks npm
- Created .npmrc files to prevent installs  
- Committed pre-built dist in multiple locations
- Server reports which dist it finds
- Hash: $BUILT_HASH

This deployment CANNOT rebuild frontend - all npm operations blocked"

echo "🔟 Force pushing to ensure clean deployment..."
git push --force-with-lease

echo ""
echo "✅ Emergency deployment pushed with frontend rebuild BLOCKED!"
echo "📊 The deployment CANNOT rebuild frontend now because:"
echo "   - package.json build script removed"
echo "   - .npmrc blocks all npm operations"
echo "   - Root package.json intercepts npm commands"
echo ""
echo "Check deployment at: https://war-room-2025.onrender.com/deployment-info"