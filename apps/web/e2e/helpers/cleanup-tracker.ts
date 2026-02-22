import type { APIRequestContext } from "@playwright/test";

export class CleanupTracker {
  private submissions: string[] = [];
  private collections: string[] = [];
  private favorites: string[] = [];

  trackSubmission(id: string) {
    this.submissions.push(id);
  }

  trackCollection(id: string) {
    this.collections.push(id);
  }

  trackFavorite(submissionId: string) {
    this.favorites.push(submissionId);
  }

  async cleanup(request: APIRequestContext) {
    for (const submissionId of this.favorites) {
      try {
        await request.delete(`/api/favorites?submissionId=${submissionId}`);
      } catch {
        // Ignore cleanup errors
      }
    }

    for (const id of this.collections) {
      try {
        await request.delete(`/api/collections/${id}`);
      } catch {
        // Ignore cleanup errors
      }
    }

    for (const id of this.submissions) {
      try {
        await request.delete(`/api/submissions/${id}`);
      } catch {
        // Ignore cleanup errors
      }
    }

    this.submissions = [];
    this.collections = [];
    this.favorites = [];
  }

  hasResources() {
    return (
      this.submissions.length > 0 ||
      this.collections.length > 0 ||
      this.favorites.length > 0
    );
  }
}
