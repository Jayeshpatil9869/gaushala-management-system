# Fix LightningCSS Error on Render

## Problem
Build fails with: `Error: Cannot find module '../lightningcss.linux-x64-gnu.node'`

## Root Cause
Tailwind CSS v4 requires LightningCSS native binaries, which aren't being downloaded during `npm install` on Render's Linux environment.

## Solution: Update Render Build Command

### Step 1: Go to Render Dashboard
Visit: https://dashboard.render.com/web/srv-d5qumsi4d50c738mpi7g/settings

### Step 2: Update Build Command
Find the "Build Command" field and replace it with:

```bash
npm install && npm install lightningcss@latest --save-dev --force && npm rebuild lightningcss --update-binary && npm run build
```

This ensures:
1. All dependencies are installed
2. LightningCSS is explicitly installed with latest version
3. Native binary is rebuilt for Linux
4. Build runs

### Step 3: Save and Deploy
1. Click "Save Changes"
2. Trigger a new deployment (or push a commit if auto-deploy is enabled)
3. Monitor the build logs

## Alternative: If Above Doesn't Work

Try this build command instead:

```bash
rm -rf node_modules/.cache && npm ci && npm install lightningcss@latest --save-dev --force && npm rebuild lightningcss --update-binary && npm run build
```

## Current Package.json Setup
- ✅ `lightningcss` is in devDependencies
- ✅ `postinstall` script is configured
- ⚠️ Build command needs manual update in Render dashboard

## Verification
After updating the build command, check that:
- Build completes without errors
- No lightningcss module errors appear
- Application deploys successfully
