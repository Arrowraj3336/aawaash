import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { fetchAllRows, fetchRowsForIds } from "./supabase-rows";
import { assignmentTeams } from "./team-assignment";

type Admin = SupabaseClient<Database>;

export async function loadTeamAssignments(admin: Admin, teamId?: string) {
  const [teams, roles] = await Promise.all([
    fetchAllRows((from, to) => {
      let query = admin.from("teams").select("id, letter, name, leader_id").eq("is_deleted", false);
      if (teamId) query = query.eq("id", teamId);
      return query.order("letter").range(from, to);
    }),
    fetchAllRows((from, to) => admin.from("user_roles").select("user_id").eq("role", "team_leader").order("user_id").range(from, to)),
  ]);
  const profiles = await fetchRowsForIds(roles.map(role => role.user_id), (ids, from, to) =>
    admin.from("profiles").select("id, full_name, team_id").in("id", ids)
      .eq("is_active", true).eq("is_deleted", false).order("id").range(from, to),
  );
  return assignmentTeams(teams, profiles);
}

export async function resolveAssignableTeam(admin: Admin, teamId: string, actor: string, expectedLeader?: string) {
  const [team] = await loadTeamAssignments(admin, teamId);
  if (!team) throw new Error("The selected team no longer exists.");
  if (!team.leader_id) throw new Error("This team has no active leader. Check its assignment in Team Leaders.");
  if (expectedLeader && expectedLeader !== team.leader_id) {
    throw new Error("This team's leader has changed. Refresh the page and choose the team again.");
  }
  if (team.needs_repair) {
    const { data, error } = await admin.from("teams").update({ leader_id: team.leader_id, updated_by: actor })
      .eq("id", teamId).eq("is_deleted", false).is("leader_id", null).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      const [current] = await loadTeamAssignments(admin, teamId);
      if (!current || current.needs_repair || current.leader_id !== team.leader_id) {
        throw new Error("The team assignment changed. Refresh the page before retrying.");
      }
    }
  }
  return { id: teamId, letter: team.letter };
}
