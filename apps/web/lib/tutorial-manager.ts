interface HintState {
  order: number;
  seen: boolean;
  dismissedAt?: string | null;
}

interface PageHints {
  [hintKey: string]: HintState;
}

interface TutorialBlob {
  status: "enabled" | "disabled";
  [page: string]: PageHints | "enabled" | "disabled";
}

export class TutorialManager {
  private blob: TutorialBlob;

  constructor(tutorialData: any = null) {
    if (!tutorialData) {
      this.blob = {
        status: "enabled",
        global: {},
      };
    } else if (typeof tutorialData === "string") {
      try {
        this.blob = JSON.parse(tutorialData);
      } catch {
        this.blob = { status: "enabled", global: {} };
      }
    } else {
      this.blob = tutorialData as TutorialBlob;
    }

    // Ensure status field exists
    if (!this.blob.status) {
      this.blob.status = "enabled";
    }
  }

  /**
   * Check if a hint has been seen
   */
  isHintSeen(page: string, hintKey: string): boolean {
    if (!this.isEnabled()) return true;

    const pageHints = this.blob[page];
    if (!pageHints || typeof pageHints === "string") return false;

    const hint = (pageHints as PageHints)[hintKey];
    return hint?.seen ?? false;
  }

  /**
   * Mark a hint as seen
   */
  markHintSeen(page: string, hintKey: string, order: number = 0): void {
    if (!this.blob[page] || typeof this.blob[page] === "string") {
      this.blob[page] = {};
    }

    const pageHints = this.blob[page] as PageHints;
    pageHints[hintKey] = {
      order,
      seen: true,
      dismissedAt: new Date().toISOString(),
    };
  }

  /**
   * Check if tutorials are enabled
   */
  isEnabled(): boolean {
    return this.blob.status === "enabled";
  }

  /**
   * Disable all tutorials
   */
  disable(): void {
    this.blob.status = "disabled";
  }

  /**
   * Enable all tutorials
   */
  enable(): void {
    this.blob.status = "enabled";
  }

  /**
   * Reset tutorial data to default state
   */
  reset(): void {
    this.blob = {
      status: "enabled",
      global: {},
    };
  }

  /**
   * Get the updated blob for database storage
   */
  toJSON(): TutorialBlob {
    return this.blob;
  }

  /**
   * Get all hints for a page with their status
   */
  getHintMetadata(page: string): Array<{ key: string } & HintState> {
    const pageHints = this.blob[page];
    if (!pageHints || typeof pageHints === "string") return [];

    return Object.entries(pageHints as PageHints).map(([key, state]) => ({
      key,
      ...state,
    }));
  }

  /**
   * Check if any hints on a page haven't been seen
   */
  hasUnseenHints(page: string): boolean {
    if (!this.isEnabled()) return false;

    const pageHints = this.blob[page];
    if (!pageHints || typeof pageHints === "string") return false;

    return Object.values(pageHints as PageHints).some((hint) => !hint.seen);
  }

  /**
   * Get the next hint to show for a page based on order and seen status.
   * Returns the hint key with the lowest order that hasn't been seen.
   *
   * @param page - Page identifier
   * @param availableHints - Array of hints available on this page with their order
   * @returns The hint key to show next, or null if all hints have been seen
   */
  getNextHint(
    page: string,
    availableHints: Array<{ key: string; order: number }>,
  ): string | null {
    if (!this.isEnabled()) return null;

    // Sort hints by order
    const sortedHints = [...availableHints].sort((a, b) => a.order - b.order);

    // Find the first hint that hasn't been seen
    for (const hint of sortedHints) {
      if (!this.isHintSeen(page, hint.key)) {
        return hint.key;
      }
    }

    return null;
  }

  /**
   * Check if there are any pending (unseen) global hints.
   * Used to determine if page hints should be suppressed in favor of global hints.
   *
   * @param availableGlobalHints - Array of global hints with their keys and orders
   * @returns true if any global hint hasn't been seen, false otherwise
   */
  hasPendingGlobalHints(
    availableGlobalHints: Array<{ key: string; order: number }>,
  ): boolean {
    if (!this.isEnabled()) return false;

    const globalHints = this.blob.global;
    if (!globalHints || typeof globalHints === "string") return false;

    // Check if any of the available global hints haven't been seen
    return availableGlobalHints.some(
      (hint) => !this.isHintSeen("global", hint.key),
    );
  }

  /**
   * Get the next pending global hint key, if any.
   * Returns the hint key with the lowest order that hasn't been seen.
   *
   * @param availableGlobalHints - Array of global hints with their keys and orders
   * @returns The next global hint key, or null if all have been seen
   */
  getNextPendingGlobalHint(
    availableGlobalHints: Array<{ key: string; order: number }>,
  ): string | null {
    return this.getNextHint("global", availableGlobalHints);
  }
}
