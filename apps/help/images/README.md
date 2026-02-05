# Help documentation screenshots

Screenshots are captured from the deployed site [www.create.spot](https://www.create.spot) and used in the help docs.

To refresh screenshots after UI changes:

1. Copy `apps/help/.env.example` to `apps/help/.env` and set `CREATE_SPOT_SCREENSHOT_USER` and `CREATE_SPOT_SCREENSHOT_PASSWORD` (Google account used to log in).
2. From `apps/help` run:

```bash
bun run capture-screenshots
```

This runs the Playwright script in `scripts/capture-screenshots.ts`, which logs in and visits key pages, then saves PNGs here. Docs reference them as `/images/filename.png`.
