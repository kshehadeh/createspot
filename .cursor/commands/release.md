Start by using the git-commit skill to commit the current changes. Then use the changelog, version-bump to prepare the changelog, bump the version and then commit the changelog and version bump. Then push the code to the remote. Finally, post the changelog to Discord using the post-changelog-to-discord script:
  
```bash
DISCORD_WEBHOOK_URL=<your-webhook-url> bun apps/web/scripts/post-changelog-to-discord.ts
```

The webhook URL should be set as an environment variable or passed directly to the script.