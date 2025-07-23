# Merge Conflict Resolution Guide

## Common Conflict Scenarios

### 1. **API Route Conflicts**

If you see conflicts in the `api/` directory, it's likely due to the migration from Express routes to file-based routes.

**Resolution:**
- Keep the new file-based API routes (`.ts` files in `api/` directory)
- Remove old Express route definitions from `server/secure-routes.ts`

### 2. **Vercel Configuration Conflicts**

In `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/public"
      }
    },
    {
      "src": "api/**/*.ts",
      "use": "@vercel/node"
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 3. **Package.json Script Conflicts**

Keep the current build configuration:
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/**/*.ts --platform=node --packages=external --format=esm --outdir=dist --target=node18",
    "start": "NODE_ENV=production node dist/index.js",
    "vercel-build": "echo 'Building for Vercel...' && npm run build"
  }
}
```

### 4. **Vite Config Conflicts**

Keep the updated configuration with `__dirname` replacement:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // ... rest of config
});
```

## Step-by-Step Resolution Process

### 1. Start Merge/Rebase
```bash
git merge main
# or
git rebase main
```

### 2. If Conflicts Occur
```bash
# Check conflicted files
git status

# Edit each conflicted file manually
# Look for conflict markers:
# <<<<<<< HEAD
# Your changes
# =======
# Incoming changes
# >>>>>>> branch-name
```

### 3. Resolve Conflicts
- Choose which version to keep
- Remove conflict markers
- Test that the code works

### 4. Mark as Resolved
```bash
# After editing each file
git add <file>

# Or add all resolved files
git add .
```

### 5. Complete the Merge
```bash
# For merge
git commit

# For rebase
git rebase --continue
```

## Key Files Priority (Keep These Versions)

1. **API Routes**: Keep all files in `api/` directory (new file-based approach)
2. **vercel.json**: Use the simplified configuration
3. **vite.config.ts**: Keep the `__dirname` compatible version
4. **server/db.ts**: Keep the WebSocket fallback version
5. **package.json**: Keep the updated build scripts

## Testing After Resolution

```bash
# Build test
npm run build

# Type check
npm run check

# Start development
npm run dev
```

## Emergency Reset (Use with Caution)

If conflicts are too complex:
```bash
# Reset to current state (loses changes)
git merge --abort
# or
git rebase --abort

# Force use current branch version
git merge -X ours main

# Force use incoming version
git merge -X theirs main
```