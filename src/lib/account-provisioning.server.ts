import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { loginIdToEmail } from "@/lib/auth";
import { nextTeamCode } from "@/lib/team-policy";

type Admin = SupabaseClient<Database>;
type Profile = Database["public"]["Tables"]["profiles"]["Update"];
export const teamFields = "id, letter, name, leader_id, is_deleted" as const;

export async function ensureAvailableLogin(admin: Admin, mobile: string, loginId: string) {
  const { data, error } = await admin.from("profiles").select("id")
    .or(`mobile_number.eq.${mobile},login_id.eq.${loginId}`).limit(1);
  if (error) throw new Error(error.message);
  if (data?.length) throw new Error("A user with that mobile number or Login ID already exists.");
}

export async function createNumberedTeam(admin: Admin, actor: string, name?: string) {
  let legacy = false;
  for (let attempt = 0; attempt < 6; attempt++) {
    const teams: { letter: string; name: string }[] = [];
    for (let start = 0; ; start += 1000) {
      const { data, error } = await admin.from("teams").select("letter, name").order("letter").range(start, start + 999);
      if (error) throw new Error(error.message);
      teams.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const number = nextTeamCode(teams.flatMap(team => {
      const legacyIndex = alphabet.indexOf(team.letter);
      return [
        team.letter,
        /^[A-Z]$/.test(team.letter) ? String(legacyIndex + 1) : "",
        /^Team ([1-9]\d*)$/i.exec(team.name)?.[1] ?? "",
      ];
    }));
    const taken = new Set(teams.map(team => team.letter));
    const preferred = alphabet[Number(number) - 1];
    const code = legacy
      ? preferred && !taken.has(preferred) ? preferred : [...alphabet].find(letter => !taken.has(letter))
      : number;
    if (!code) throw new Error("All legacy team codes are in use. Apply the numbered-team database migration before adding another leader.");

    const { data, error } = await admin.from("teams").insert({
      letter: code,
      name: name || `Team ${number}`,
      description: `Aawaash Sales Team ${number}`,
      created_by: actor,
      updated_by: actor,
    }).select(teamFields).single();
    if (!error && data) return data;
    if (!legacy && error?.code === "23514" && error.message.includes("teams_letter_check")) {
      legacy = true;
      continue;
    }
    if (error?.code !== "23505") throw new Error(error?.message ?? "Could not create a team.");
  }
  throw new Error("The team code was claimed by another request. Please try again.");
}

export async function provisionAccount(admin: Admin, input: {
  fullName: string;
  mobile: string;
  password: string;
  loginId: string;
  role: "team_leader" | "member";
  team: { id: string; letter: string };
  actor: string;
  profile?: Profile;
  teamName?: string;
}) {
  const { fullName, mobile, password, loginId, role, team, actor, profile, teamName } = input;
  const { data, error } = await admin.auth.admin.createUser({
    email: loginIdToEmail(loginId), password, email_confirm: true,
    user_metadata: { full_name: fullName, mobile_number: mobile, login_id: loginId, team_letter: team.letter },
  });
  if (error || !data.user) throw new Error(error?.message ?? "Could not create the sign-in account.");
  const userId = data.user.id;
  try {
    const { data: saved, error: profileError } = await admin.from("profiles").update({
      ...profile, team_id: team.id, created_by: actor, updated_by: actor,
    }).eq("id", userId).select("id, team_id").maybeSingle();
    if (profileError || saved?.team_id !== team.id) throw new Error(profileError?.message ?? "The new account team assignment was not saved.");
    const { error: roleError } = await admin.from("user_roles")
      .upsert({ user_id: userId, role, granted_by: actor }, { onConflict: "user_id,role" });
    if (roleError) throw new Error(roleError.message);
    if (role === "team_leader") {
      const { error: removeError } = await admin.from("user_roles").delete().eq("user_id", userId).eq("role", "member");
      if (removeError) throw new Error(removeError.message);
      const { data: assigned, error: assignError } = await admin.from("teams").update({
        leader_id: userId, updated_by: actor, ...(teamName ? { name: teamName } : {}),
      }).eq("id", team.id).eq("is_deleted", false).is("leader_id", null).select("id").maybeSingle();
      if (assignError || !assigned) throw new Error(assignError?.message ?? "This team already has a leader or was archived.");
    }
  } catch (failure) {
    try {
      const { error: cleanupError } = await admin.auth.admin.deleteUser(userId);
      if (cleanupError) throw cleanupError;
    } catch (cleanupError) {
      console.error("[Account provisioning] Rollback failed", userId, cleanupError);
      throw new Error("Account setup could not finish. Check the Users list before retrying.");
    }
    throw failure;
  }

  try {
    const { error: auditError } = await admin.from("audit_logs").insert({
      actor_id: actor, action: role === "team_leader" ? "create_team_leader" : "create_member",
      entity_type: "profile", entity_id: userId,
      new_value: { team_id: team.id, team_letter: team.letter, login_id: loginId },
    });
    if (auditError) console.error("[Account provisioning] Audit write failed", userId, auditError);
  } catch (auditError) {
    console.error("[Account provisioning] Audit write failed", userId, auditError);
  }
  return { ok: true as const, userId, loginId, teamLetter: team.letter };
}
