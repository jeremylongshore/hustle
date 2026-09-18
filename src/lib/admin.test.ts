import { describe, expect, it } from "vitest";
import { adminUserIds, isAdmin } from "@/lib/admin";

describe("admin allow-list (fail closed)", () => {
  it("treats an unset or empty ADMIN_USER_IDS as no admins", () => {
    expect(isAdmin("user-1", {} as NodeJS.ProcessEnv)).toBe(false);
    expect(isAdmin("user-1", { ADMIN_USER_IDS: "" } as NodeJS.ProcessEnv)).toBe(false);
    expect(isAdmin("user-1", { ADMIN_USER_IDS: " , ," } as NodeJS.ProcessEnv)).toBe(false);
  });

  it("admits only listed user IDs, trimming whitespace", () => {
    const env = { ADMIN_USER_IDS: " admin-a ,admin-b" } as NodeJS.ProcessEnv;
    expect(isAdmin("admin-a", env)).toBe(true);
    expect(isAdmin("admin-b", env)).toBe(true);
    expect(isAdmin("parent-c", env)).toBe(false);
    expect([...adminUserIds(env)]).toEqual(["admin-a", "admin-b"]);
  });

  it("never admits a missing user ID", () => {
    const env = { ADMIN_USER_IDS: "admin-a" } as NodeJS.ProcessEnv;
    expect(isAdmin(undefined, env)).toBe(false);
    expect(isAdmin(null, env)).toBe(false);
    expect(isAdmin("", env)).toBe(false);
  });
});
