import { describe, expect, it } from "vitest";
import { assignmentTeams } from "@/lib/team-assignment";

const team = { id: "team", letter: "A", name: "Team A", leader_id: null };
const leader = { id: "leader", full_name: "Example Leader", team_id: "team" };

describe("member assignment teams", () => {
  it("returns a team's assigned leader without depending on member accounts", () => {
    const [row] = assignmentTeams([{ ...team, leader_id: leader.id }], [leader]);
    expect(row).toMatchObject({ team_id: team.id, leader_id: leader.id, needs_repair: false });
  });
  it("identifies one active leader from a legacy team with a missing link", () => {
    expect(assignmentTeams([team], [leader])[0]).toMatchObject({
      leader_id: leader.id, leader_name: leader.full_name, needs_repair: true,
    });
  });
  it("does not repair an ambiguous link or replace an assigned leader", () => {
    expect(assignmentTeams([team], [leader, { ...leader, id: "other" }])[0]?.leader_id).toBeNull();
    expect(assignmentTeams([{ ...team, leader_id: "inactive" }], [leader])[0]?.leader_id).toBeNull();
  });
});
