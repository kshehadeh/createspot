import { describe, expect, test } from "bun:test";
import { filenameToTitle } from "./upload-image";

describe("filenameToTitle", () => {
  test("removes extension", () => {
    expect(filenameToTitle("my-photo.jpg")).toBe("my photo");
  });

  test("replaces underscores and dashes with spaces", () => {
    expect(filenameToTitle("my_best-photo_ever.png")).toBe(
      "my best photo ever",
    );
  });

  test("trims whitespace and collapses spaces", () => {
    expect(filenameToTitle("  my--photo__file  .webp")).toBe("my photo file");
  });

  test("handles filename without extension", () => {
    expect(filenameToTitle("untitled")).toBe("untitled");
  });
});
