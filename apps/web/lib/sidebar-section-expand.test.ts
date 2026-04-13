import { describe, expect, test } from "bun:test";
import {
  getCreateSectionExpandedForPath,
  getDefaultSidebarNavMode,
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

describe("getDefaultSidebarNavMode", () => {
  const user = { id: "user-1", slug: null as string | null };

  test("inspire when not signed in", () => {
    expect(getDefaultSidebarNavMode("/dashboard", null)).toBe("inspire");
    expect(getDefaultSidebarNavMode("/", null)).toBe("inspire");
  });

  test("create when signed in on dashboard or creator hub", () => {
    expect(getDefaultSidebarNavMode("/dashboard", user)).toBe("create");
    expect(getDefaultSidebarNavMode("/creators/user-1", user)).toBe("create");
    expect(
      getDefaultSidebarNavMode("/creators/user-1/portfolio", user),
    ).toBe("create");
  });

  test("inspire when signed in on feed and inspire routes", () => {
    expect(getDefaultSidebarNavMode("/", user)).toBe("inspire");
    expect(getDefaultSidebarNavMode("/inspire/exhibition", user)).toBe(
      "inspire",
    );
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
