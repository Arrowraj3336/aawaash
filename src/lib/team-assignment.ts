type Team = { id: string; letter: string; name: string; leader_id: string | null };
type Leader = { id: string; full_name: string | null; team_id: string | null };

export function assignmentTeams(teams: Team[], leaders: Leader[]) {
  const byId = new Map(leaders.map(leader => [leader.id, leader]));
  const byTeam = new Map<string, Leader[]>();
  for (const leader of leaders) {
    if (!leader.team_id) continue;
    const candidates = byTeam.get(leader.team_id) ?? [];
    candidates.push(leader);
    byTeam.set(leader.team_id, candidates);
  }

  return teams.map(team => {
    const candidates = byTeam.get(team.id) ?? [];
    const leader = team.leader_id ? byId.get(team.leader_id) : candidates.length === 1 ? candidates[0] : undefined;
    return {
      team_id: team.id,
      letter: team.letter,
      name: team.name,
      leader_id: leader?.id ?? null,
      leader_name: leader?.full_name ?? null,
      needs_repair: Boolean(leader && !team.leader_id),
    };
  });
}
