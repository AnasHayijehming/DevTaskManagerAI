# GitHub Pages Deployment Setup Guide

## Prerequisites
- Vite React application
- GitHub repository

## Step-by-Step Setup

### 1. Create gh-pages branch
```bash
# If gh-pages branch exists, delete it first
git branch -D gh-pages
# Create new gh-pages branch
git checkout -b gh-pages
git checkout main  # Switch back to main branch
```

### 2. Install required dependencies
```bash
npm install gh-pages --save-dev
npm install --save-dev @vitejs/plugin-react
```

### 3. Configure package.json
Add the following to your `package.json`:

```json
{
  "homepage": "https://anashayijehming.github.io/DevTaskManagerAI",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

### 4. Configure vite.config.js
Update your `vite.config.js`:

```javascript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/DevTaskManagerAI/',
  plugins: [react()],
})
```

### 5. Deploy to GitHub Pages
```bash
npm run deploy
```

## Notes
- The `predeploy` script automatically builds the project before deployment
- The `base` configuration in Vite ensures assets are loaded correctly on GitHub Pages
- Make sure your repository name matches the base path in the configuration
