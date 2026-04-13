
export type Player = {
  id: string;
  name: string;
  position: string;
  shirtNumber: string;
  nationality: string;
  teamId: string;
  teamName: string;
  type: string;
};

export type Referee = {
  role: string;
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  nationalityCode?: string;
  nationalityName?: string;
};

export type Coach = {
  id: string;
  name: string;
  nationality?: string;
  role?: string;
  teamId?: string;
  teamName?: string;
};

export type TeamInfo = {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  score: number | null;
  area: string;
  coach?: Coach;
};

export type CleanMatch = {
  sport: string;
  matchId: string;
  winner: string;
  date: string;
  time: string;
  status: string;
  competition?: { id: string; name: string, gender: string, area: string, type: string, format: string } | null;
  season?: { id: string; title: string; logo?: string, startDate: string, endDate: string, original_name: string } | null;
  round?: { id: string; name: string; currentGameweek?: string; totalGameweek?: string } | null;
  team_a: TeamInfo;
  team_b: TeamInfo;
  venue: {
    name: string;
    city: string;
    area: string;
    attendance?: number;
  } | null;
  referees: Referee[];
  lineup: {
    team_a: Player[];
    team_b: Player[];
  };
  periodScores?: Record<string, { a: number; b: number }>;
  timeline?: Array<{
    type: "goal" | "substitution" | "bookings";
    minute: string;
    team: "team_a" | "team_b";
    player: string;
    subPlayer?: string;
    scoreText?: string;
  }>;
};

export function extractMatchData(apiResponse: any): CleanMatch[] {
  const safeArray = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return [data];
  };

  const ds = apiResponse?.datasportsgroup ?? apiResponse ?? {};
  const tours = safeArray(ds?.tour);
  const out: CleanMatch[] = [];

  for (const tour of tours) {
    const seasons = safeArray(tour?.tour_season);
    for (const ts of seasons) {
      const competitions = safeArray(ts?.competition);
      for (const comp of competitions) {
        const compSeasons = safeArray(comp?.season);
        for (const season of compSeasons) {
          const disciplines = safeArray(season?.discipline);
          for (const disc of disciplines) {
            const genders = safeArray(disc?.gender);
            for (const gen of genders) {
              const rounds = safeArray(gen?.round);
              for (const rnd of rounds) {
                const lists = safeArray(rnd?.list);
                for (const list of lists) {
                  const matches = safeArray(list?.match);
                  for (const match of matches) {
                    const sport = String(ds?.sport ?? "");
                    const matchId = String(match?.match_id ?? "");
                    const winner = String(match?.winner ?? "");
                    const date = String(match?.date ?? "");
                    const time = String(match?.time ?? "");
                    const status = String(match?.status ?? "");
                    const homeScoreRaw = match?.score_a;
                    const awayScoreRaw = match?.score_b;
                    const homeScoreNum = homeScoreRaw !== undefined && homeScoreRaw !== null ? Number(homeScoreRaw) : NaN;
                    const awayScoreNum = awayScoreRaw !== undefined && awayScoreRaw !== null ? Number(awayScoreRaw) : NaN;
                    const homeScore = Number.isFinite(homeScoreNum) ? homeScoreNum : null;
                    const awayScore = Number.isFinite(awayScoreNum) ? awayScoreNum : null;

                    const homeTeam: TeamInfo = {
                      id: String(match?.team_a_id ?? ""),
                      name: String(match?.team_a_name ?? ""),
                      shortName: String(match?.team_a_short_name ?? ""),
                      logo: String(match?.team_a_logo ?? ""),
                      score: homeScore,
                      area: String(match?.team_a_area_code ?? "")
                    };
                    const awayTeam: TeamInfo = {
                      id: String(match?.team_b_id ?? ""),
                      name: String(match?.team_b_name ?? ""),
                      shortName: String(match?.team_b_short_name ?? ""),
                      logo: String(match?.team_b_logo ?? ""),
                      score: awayScore,
                      area: String(match?.team_b_area_code ?? "")
                    };

                    const compNode = comp ?? {};
                    const seasonNode = season ?? {};
                    const roundNode = rnd ?? {};
                    const roundExtra = Array.isArray(roundNode?.round_extra) ? roundNode.round_extra[0] : undefined;

                    const venueNode = match?.match_extra?.[0]?.venue?.[0];
                    const venue =
                      venueNode
                        ? {
                            name: String(venueNode?.venue_name ?? ""),
                            city: String(venueNode?.venue_city ?? ""),
                            area: String(venueNode?.venue_area_name ?? ""),
                            attendance: Number(match?.match_extra?.[0]?.attendance ?? 0),
                          }
                        : null;

                    const refereesList = safeArray(match?.referees?.[0]?.referee);
                    const referees: Referee[] = refereesList.map((r: any) => ({
                      role: String(r?.role ?? ""),
                      id: String(r?.people_id ?? ""),
                      firstName: String(r?.first_name ?? ""),
                      lastName: String(r?.last_name ?? ""),
                      name: String(r?.common_name ?? [r?.first_name, r?.last_name].filter(Boolean).join(" ")).trim(),
                      nationalityCode: String(r?.nationality_area_code ?? ""),
                      nationalityName: String(r?.nationality_area_name ?? ""),
                    }));

                    const coachesEvents = safeArray(match?.events?.[0]?.coaches?.[0]?.event);
                    let homeCoach: Coach | undefined;
                    let awayCoach: Coach | undefined;
                    for (const c of coachesEvents) {
                      const coachObj: Coach = {
                        id: String(c?.people_id ?? ""),
                        name: String(c?.common_name ?? [c?.first_name, c?.last_name].filter(Boolean).join(" ")).trim(),
                        nationality: String(c?.nationality ?? ""),
                        role: String(c?.role ?? ""),
                        teamId: String(c?.team_id ?? ""),
                        teamName: String(c?.team_name ?? ""),
                      };
                      if (String(c?.team_id) === String(match?.team_a_id)) homeCoach = coachObj;
                      if (String(c?.team_id) === String(match?.team_b_id)) awayCoach = coachObj;
                    }

                    const eventsRoot = list?.events?.[0] ?? match?.events?.[0] ?? {};
                    const lineupEvents = safeArray(eventsRoot?.lineups?.[0]?.event);
                    const substitutionOnBench = safeArray(eventsRoot?.subs_on_bench?.[0]?.event);
                    const homeLineup: Player[] = [];
                    const awayLineup: Player[] = [];
                    for (const p of lineupEvents) {
                      const player: Player = {
                        id: String(p?.people_id ?? ""),
                        name: String(p?.short_name ?? [p?.first_name, p?.last_name].filter(Boolean).join(" ")).trim(),
                        position: String(p?.position ?? ""),
                        shirtNumber: String(p?.shirtnumber ?? ""),
                        nationality: String(p?.nationality ?? ""),
                        teamId: String(p?.team_id ?? ""),
                        teamName: String(p?.team_name ?? ""),
                        type: String(p?.type ?? ""),
                      };
                      if (String(p?.team_id) === String(match?.team_a_id)) {
                        homeLineup.push(player);
                      } else if (String(p?.team_id) === String(match?.team_b_id)) {
                        awayLineup.push(player);
                      }
                    }
                    for (const p of substitutionOnBench) {
                    const player: Player = {
                      id: String(p?.people_id ?? ""),
                      name: String(p?.short_name ?? [p?.first_name, p?.last_name].filter(Boolean).join(" ")).trim(),
                      position: String(p?.position ?? ""),
                      shirtNumber: String(p?.shirtnumber ?? ""),
                      nationality: String(p?.nationality ?? ""),
                      teamId: String(p?.team_id ?? ""),
                      teamName: String(p?.team_name ?? ""),
                      type: String(p?.type ?? ""),
                    };
                    if (String(p?.team_id) === String(match?.team_a_id)) {
                      homeLineup.push(player);
                    } else if (String(p?.team_id) === String(match?.team_b_id)) {
                      awayLineup.push(player);
                    }
                  }

                    homeTeam.coach = homeCoach;
                    awayTeam.coach = awayCoach;

                    const timeline: CleanMatch["timeline"] = [];
                    const goalEvents = safeArray(eventsRoot?.scores?.[0]?.event);
                    for (const g of goalEvents) {
                      const eventId = String(g?.event_id ?? "");
                      const name = String(g?.short_name ?? [g?.first_name, g?.last_name].filter(Boolean).join(" ")).trim();
                      const min = String(g?.minute ?? "");
                      const type = String(g?.type ?? "");
                      const team = String(g?.team_id) === String(match?.team_a_id) ? "team_a" : "team_b";
                      const scoreText = (g?.event_extra && g.event_extra[0]?.score_text)
                        ? String(g.event_extra[0]?.score_text)
                        : undefined;
                      const period = String(g?.period || "").toLowerCase();
                      timeline.push({
                        eventId,
                        type: type,
                        minute: min ? `${min}'` : "",
                        team,
                        player: name,
                        period,
                        scoreText,
                      });
                    }
                    const bookingEvents = safeArray(eventsRoot?.bookings?.[0]?.event);
                    for (const g of bookingEvents) {
                      const eventId = String(g?.event_id ?? "");
                      const name = String(g?.short_name ?? [g?.first_name, g?.last_name].filter(Boolean).join(" ")).trim();
                      const min = String(g?.minute ?? "");
                      const type = String(g?.type ?? "");
                      const team = String(g?.team_id) === String(match?.team_a_id) ? "team_a" : "team_b";
                      const scoreText = (g?.event_extra && g.event_extra[0]?.score_text)
                        ? String(g.event_extra[0]?.score_text)
                        : undefined;
                      const period = String(g?.period || "").toLowerCase();
                      timeline.push({
                        eventId,
                        type: type,
                        minute: min ? `${min}'` : "",
                        team,
                        player: name,
                        period,
                        scoreText,
                      });
                    }
                    const subsTimeline = safeArray(eventsRoot?.substitutions?.[0]?.event);
                    for (const s of subsTimeline) {
                      const eventId = String(s?.event_id ?? "");
                      if (String(s?.type || "").toLowerCase() !== "substitute_in") continue;
                      const inName = String(s?.short_name ?? [s?.first_name, s?.last_name].filter(Boolean).join(" ")).trim();
                      const out = Array.isArray(s?.event) ? s.event.find((ev: any) => String(ev?.type || "").toLowerCase() === "substitute_out") : null;
                      const outName = out
                        ? String(out?.short_name ?? [out?.first_name, out?.last_name].filter(Boolean).join(" ")).trim()
                        : undefined;
                      const period = String(s?.period || "").toLowerCase();
                      const type = String(s?.type || "").toLowerCase();
                      const min = String(s?.minute ?? "");
                      const team = String(s?.team_id) === String(match?.team_a_id) ? "team_a" : "team_b";
                      timeline.push({
                        eventId,
                        type: type,
                        minute: min ? `${min}'` : "",
                        team,
                        period,
                        player: inName,
                        subPlayer: outName,
                      });
                    }

                    // Period scores
                    const psArr = safeArray(match?.period_scores);
                    const psPeriods = safeArray(psArr?.[0]?.period);
                    const periodScores: Record<string, { a: number; b: number }> = {};
                    for (const p of psPeriods) {
                      const t = String(p?.type ?? "").toLowerCase(); // e.g., p1s, p2s
                      const aRaw = p?.score_a;
                      const bRaw = p?.score_b;
                      const aNum = aRaw !== undefined && aRaw !== null ? Number(aRaw) : NaN;
                      const bNum = bRaw !== undefined && bRaw !== null ? Number(bRaw) : NaN;
                      const a = Number.isFinite(aNum) ? aNum : 0;
                      const b = Number.isFinite(bNum) ? bNum : 0;
                      periodScores[`soc_${t}`] = { a, b };
                    }
                    periodScores['soc_p2s'] = { a: Number.isFinite(homeScoreNum) ? homeScoreNum : 0, b: Number.isFinite(awayScoreNum) ? awayScoreNum : 0 };

                    out.push({
                      sport,
                      matchId,
                      date,
                      time,
                      status,
                      winner,
                      competition: { id: String(compNode?.competition_id ?? ""), name: String(compNode?.name ?? ""), gender: String(compNode?.gender ?? ""), area: String(compNode?.area_name ?? ""), type: String(compNode?.type ?? ""), format: String(compNode?.format ?? "") },
                      season: { id: String(seasonNode?.season_id ?? ""), title: String(seasonNode?.title ?? ""), logo: String(seasonNode?.logo ?? ""), startDate: String(seasonNode?.start_date ?? ""), endDate: String(seasonNode?.end_date ?? ""), original_name: String(seasonNode?.original_name ?? "") },
                      round: {
                        id: String(roundNode?.round_id ?? ""),
                        name: String(roundNode?.name ?? ""),
                        currentGameweek: String(roundExtra?.current_gameweek ?? ""),
                        totalGameweek: String(roundExtra?.total_gameweek ?? ""),
                      },
                      team_a: homeTeam,
                      team_b: awayTeam,
                      venue,
                      referees,
                      lineup: { team_a: homeLineup, team_b: awayLineup },
                      periodScores,
                      timeline,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return out;
}
