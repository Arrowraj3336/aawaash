/**
 * Team policy — shared rules for teams, Team Leaders and members.
 *
 * - Team Leaders are unlimited: every new leader gets their own team.
 * - Members per team are unlimited.
 * - Teams are numbered: Team 1, Team 2, Team 3 … (stored as "1", "2", …).
 * - Legacy letter codes (A–ZZZ) are still accepted for old login IDs.
 */

export const TEAM_NUMBER_PATTERN = /^[1-9]\d*$/;
export const TEAM_CODE_PATTERN = /^([1-9]\d*|[A-Z]{1,3})$/;

export function isValidTeamCode(code: string) {
  return TEAM_CODE_PATTERN.test(code);
}

/** Team Leaders are never capped. */
export function canAddTeamLeader(_currentLeaders: number) {
  return true;
}

export function canAssignMemberToTeam(hasTeamLeader: boolean) {
  return hasTeamLeader;
}

/** Returns the lowest unused team number as a string. */
export function nextTeamCode(existing: string[]) {
  const used = new Set(existing);
  let next = 1n;
  while (used.has(String(next))) next++;
  return String(next);
}

/** Sort numbered teams numerically, followed by legacy letter codes. */
export function compareTeamCodes(a: string, b: string) {
  const aNumbered = TEAM_NUMBER_PATTERN.test(a);
  const bNumbered = TEAM_NUMBER_PATTERN.test(b);
  if (aNumbered !== bNumbered) return aNumbered ? -1 : 1;
  return a.length - b.length || a.localeCompare(b);
}

/** Human label, e.g. "Team 4". */
export function teamLabel(code: string | null | undefined) {
  return code ? `Team ${code}` : "Unassigned";
}
