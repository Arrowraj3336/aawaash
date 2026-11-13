import { describe, expect, it, vi } from "vitest";
import { createNumberedTeam, provisionAccount } from "@/lib/account-provisioning.server";

type Admin = Parameters<typeof provisionAccount>[0];
const input = {
  fullName: "Test Person",
  mobile: "0000000001",
  password: "FixturePassword!123",
  loginId: "0000000001",
  role: "team_leader" as const,
  team: { id: "team-4", letter: "4" },
  actor: "admin",
};

describe("account provisioning", () => {
  it("uses the next numbered code when the schema accepts it", async () => {
    const insert = vi.fn().mockReturnValue({
      select: () => ({ single: async () => ({ data: { id: "team-4", letter: "4" }, error: null }) }),
    });
    const admin = {
      from: () => ({
        select: () => ({ order: () => ({ range: async () => ({
          data: ["A", "B", "C"].map(letter => ({ letter, name: `Team ${letter}` })),
          error: null,
        }) }) }),
        insert,
      }),
    } as unknown as Admin;
    expect((await createNumberedTeam(admin, "admin")).letter).toBe("4");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ letter: "4", name: "Team 4" }));
  });

  it("can create a leader's team against the legacy check constraint", async () => {
    const insert = vi.fn().mockImplementation(({ letter }) => ({
      select: () => ({ single: async () => letter === "4"
        ? { data: null, error: { code: "23514", message: 'violates check constraint "teams_letter_check"' } }
        : { data: { id: "team-4", letter, name: "Team 4" }, error: null },
      }),
    }));
    const admin = {
      from: () => ({
        select: () => ({ order: () => ({ range: async () => ({
          data: ["A", "B", "C"].map(letter => ({ letter, name: `Team ${letter}` })),
          error: null,
        }) }) }),
        insert,
      }),
    } as unknown as Admin;
    expect((await createNumberedTeam(admin, "admin")).letter).toBe("D");
    expect(insert).toHaveBeenNthCalledWith(2, expect.objectContaining({ letter: "D", name: "Team 4" }));
  });

  it("removes the new Auth account when profile persistence fails", async () => {
    const deleteUser = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq: () => ({ select: () => ({
      maybeSingle: async () => ({ data: null, error: { message: "profile write failed" } }),
    }) }) }));
    const admin = {
      auth: { admin: {
        createUser: vi.fn().mockResolvedValue({ data: { user: { id: "created-user" } }, error: null }),
        deleteUser,
      } },
      from: () => ({ update }),
    } as unknown as Admin;
    await expect(provisionAccount(admin, input)).rejects.toThrow("profile write failed");
    expect(deleteUser).toHaveBeenCalledWith("created-user");
  });
});
