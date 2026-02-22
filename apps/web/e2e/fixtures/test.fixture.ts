import { test as base } from "@playwright/test";
import { CleanupTracker } from "../helpers/cleanup-tracker";

type TestFixtures = {
  cleanup: CleanupTracker;
};

export const test = base.extend<TestFixtures>({
  cleanup: async ({ request }, use) => {
    const tracker = new CleanupTracker();
    await use(tracker);
    if (tracker.hasResources()) {
      await tracker.cleanup(request);
    }
  },
});

export { expect } from "@playwright/test";
