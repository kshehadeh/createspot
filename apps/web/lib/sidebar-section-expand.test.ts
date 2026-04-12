import { describe, expect, test } from "bun:test";
import {
  getCreateSectionExpandedForPath,
  getInspireSectionExpandedForPath,
  isPathActive,
} from "./sidebar-section-expand";

describe("getInspireSectionExpandedForPath", () => {
  test("home routes expand", () => {
    expect(getInspireSectionExpandedForPath("/")).toBe(true);
    expect(getInspireSectionExpandedForPath("")).toBe(true);
  });

  test("/inspire hub and subtree expand", () => {
    expect(getInspireSectionExpandedForPath("/inspire")).toBe(true);
    expect(getInspireSectionExpandedForPath("/inspire/exhibition")).toBe(true);
    expect(getInspireSectionExpandedForPath("/inspire/community")).toBe(true);
  });

  test("/creators listing expands", () => {
    expect(getInspireSectionExpandedForPath("/creators")).toBe(true);
  });

  test("dashboard does not expand Inspire by default", () => {
    expect(getInspireSectionExpandedForPath("/dashboard")).toBe(false);
  });
});

describe("getCreateSectionExpandedForPath", () => {
  const user = { id: "user-1", slug: null as string | null };

  test("false without user", () => {
    expect(getCreateSectionExpandedForPath("/dashboard", null)).toBe(false);
    expect(getCreateSectionExpandedForPath("/dashboard", undefined)).toBe(
      false,
    );
    expect(getCreateSectionExpandedForPath("/dashboard", {})).toBe(false);
  });

  test("dashboard subtree expands", () => {
    expect(getCreateSectionExpandedForPath("/dashboard", user)).toBe(true);
    expect(getCreateSectionExpandedForPath("/dashboard/foo", user)).toBe(true);
  });

  test("creator profile subtree expands", () => {
    expect(getCreateSectionExpandedForPath("/creators/user-1", user)).toBe(
      true,
    );
    expect(
      getCreateSectionExpandedForPath("/creators/user-1/portfolio", user),
    ).toBe(true);
  });

  test("inspire routes do not expand Create", () => {
    expect(getCreateSectionExpandedForPath("/inspire", user)).toBe(false);
  });
});

describe("isPathActive", () => {
  test("exact and nested", () => {
    expect(isPathActive("/inspire/community", "/inspire/community")).toBe(true);
    expect(
      isPathActive("/inspire/community", "/inspire/community/threads"),
    ).toBe(true);
    expect(isPathActive("/inspire/community", "/inspire")).toBe(false);
  });
});
