# "Debugger listening on ws://..." in Vercel Production

## What you're seeing

Logs show `level: "error"` with message:

```text
Debugger listening on ws://127.0.0.1:XXXXX/<uuid>
```

That means the Node.js serverless runtime is starting with the **inspector** enabled (e.g. `NODE_OPTIONS=--inspect`). The inspector adds overhead and can contribute to slow cold starts and request latency.

## Cause

This repo does **not** set `NODE_OPTIONS` or `--inspect` anywhere. The setting is coming from outside the repo—usually from **Vercel** or how the Node process is launched.

If **`NODE_OPTIONS` is not set in your project’s Environment Variables**, the inspector can still be enabled by:

1. **Team or account env** – Vercel can inherit env from **Team** or **Account**. In **Settings → Environment Variables**, check which scope each variable has (Production / Preview / Development) and whether any **`NODE_OPTIONS`** is defined at a parent scope.
2. **Vercel integrations** – An integration might inject env vars (e.g. a debugging or monitoring one). Review **Settings → Integrations**.
3. **Vercel platform** – In rare cases the platform or a feature (e.g. a “debug” or “inspect” deployment option) might add flags. Check deployment settings and [Vercel docs](https://vercel.com/docs) for anything related to debugging or Node options.
4. **Override from build** – Unlikely, but if something in the build writes env or config that the runtime reads, that could affect it. The runtime is still started by Vercel with whatever env it has at invoke time.

## Fix: force-disable the inspector

Even if you don’t see `NODE_OPTIONS` in the project UI, you can **override** it so the inspector is never enabled:

1. Open [Vercel Dashboard](https://vercel.com) → your project (**createspot**) → **Settings** → **Environment Variables**.
2. **Add** (or edit) **`NODE_OPTIONS`**:
   - **Key:** `NODE_OPTIONS`
   - **Value:** leave **empty**, or set to a value that does **not** include `--inspect` / `--inspect-brk` (e.g. `--max-old-space-size=4096` if you need that).
   - **Environments:** Production (and Preview if you want).
3. **Redeploy.** Project-level env usually overrides inherited values, so new invocations should no longer start with the inspector.

If the message persists, check Team/Account env and integrations, or contact Vercel support and ask what is setting `--inspect` for your serverless Node runtime.

## Mitigation in code

The app’s **instrumentation** hook closes the Node inspector in production when it is open. That reduces ongoing overhead; it does not prevent the initial "Debugger listening on ws://..." log. Explicitly setting `NODE_OPTIONS` in Vercel (as above) is the proper fix.
