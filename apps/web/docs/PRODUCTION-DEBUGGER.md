# "Debugger listening on ws://127.0.0.1:..." in production logs

If you see this in production logs:

```
Debugger listening on ws://127.0.0.1:45091/2d8e5a64-2a43-4bed-b640-453edd22db2a
```

the Node (or Bun) process is running with the **inspector** enabled (e.g. `--inspect`). The app’s `start` script is just `next start`, so the flag is coming from the **deployment environment**, not from the repo.

## Why it matters

- **Security:** The inspector can execute arbitrary code; it should not be open in production.
- **Overhead:** Debugger hooks add some runtime cost.

## How to fix it

1. **Vercel**
   - **Environment Variables:** Remove or override `NODE_OPTIONS` for Production if it contains `--inspect`, `--inspect-brk`, or a port (e.g. `--inspect=0.0.0.0:9229`). Ensure Production does not inherit a variable that was intended only for Preview/Development.
   - **Debug / Inspect:** In Project Settings, turn off any “Debug” or “Inspect” option for production if present.

2. **Other hosts**
   - In the production environment configuration, remove:
     - `NODE_OPTIONS=--inspect` (or any value that includes `--inspect`)
     - `BUN_INSPECT=1` (if running with Bun)

3. **Redeploy** after changing environment variables so the new runtime no longer starts with the inspector.

## Debugging production safely

If you need to use the inspector to debug a production-like issue:

- Use a **staging** or **preview** deployment and enable the inspector only there for a short time, then disable it again.
- Do not leave the inspector enabled on the main production environment.
