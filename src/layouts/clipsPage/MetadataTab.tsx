import React, { useEffect, useState } from "react";

// Types
interface MatchEvent {
  id: string;
  type: "goal" | "foul" | "yellow-card" | "substitution" | "match-started" | "match-finished" | "end-of-half" | "added-time" | "half-started" | "penalty-started" | "scored" | "missed" | "bookings";
  time: string;
  team?: "home" | "away";
  player?: string;
  subPlayer?: string;
  description: string;
}
//dsg.ts
interface Player {
  number: string;
  position: "GK" | "DF" | "MF" | "FW";
  name: string;
  nationality: string;
  age: number;
}

const MetadataTab: React.FC<{ matchId?: string; matchPayload?: any; cleanMatch?: any; loading?: boolean; error?: string }> = ({ matchId, matchPayload, cleanMatch, loading, error }) => {
  // console.log(cleanMatch);
  const [homeLineup, setHomeLineup] = useState<Player[]>([]);
  const [awayLineup, setAwayLineup] = useState<Player[]>([]);
  const [matchEventsDyn, setMatchEventsDyn] = useState<MatchEvent[]>([]);
  const apiBase = (import.meta as any).env?.VITE_VIDEO_API_URL || "";
  const proxiedSrc = (u: string) => {
    const s = String(u || "").replace(/[`"]/g, "").trim();
    return s && s.includes("dsg-images.com") ? `${apiBase}/api/streams/dsg/image?url=${encodeURIComponent(s)}` : s;
  };
  const cmTeamA = cleanMatch?.lineup?.team_a || [];
  const cmTeamB = cleanMatch?.lineup?.team_b || [];
  const cmStartersA = cmTeamA.filter((p: any) => String(p?.type || "").toLowerCase() !== "sub_on_bench");
  const cmStartersB = cmTeamB.filter((p: any) => String(p?.type || "").toLowerCase() !== "sub_on_bench");
  const cmSubsA = cmTeamA.filter((p: any) => String(p?.type || "").toLowerCase() === "sub_on_bench");
  const cmSubsB = cmTeamB.filter((p: any) => String(p?.type || "").toLowerCase() === "sub_on_bench");
  const toDisplayPlayer = (item: any) => {
    if (item && typeof item === "object" && "shirtNumber" in item) {
      const mapPos = (p: string) => {
        if (!p) return "MF";
        if (/goalkeeper/i.test(p)) return "GK";
        if (/defender/i.test(p)) return "DF";
        if (/midfielder/i.test(p)) return "MF";
        if (/attacker|forward/i.test(p)) return "AT";
        return "MF";
      };
      return {
        number: String(item.shirtNumber || ""),
        position: mapPos(String(item.position || "")) as any,
        name: String(item.name || ""),
        nationality: String(item.nationality || ""),
        age: 0,
      };
    }
    return item;
  };
 
  useEffect(() => {
    if (!cleanMatch) return;
    const mapPos = (p: string) => {
      if (!p) return "MF";
      if (/goalkeeper/i.test(p)) return "GK";
      if (/defender/i.test(p)) return "DF";
      if (/midfielder/i.test(p)) return "MF";
      if (/attacker|forward/i.test(p)) return "AT";
      return "MF";
    };
    setHomeLineup(
      (cleanMatch?.lineup?.team_a || []).map((p: any) => ({
        number: String(p?.shirtNumber || ""),
        position: mapPos(String(p?.position || "")) as any,
        name: String(p?.name || ""),
        nationality: "", // not provided in CleanMatch spec
        age: 0, // not provided in CleanMatch spec
      }))
    );
    setAwayLineup(
      (cleanMatch?.lineup?.team_b || []).map((p: any) => ({
        number: String(p?.shirtNumber || ""),
        position: mapPos(String(p?.position || "")) as any,
        name: String(p?.name || ""),
        nationality: "",
        age: 0,
      }))
    );
  }, [cleanMatch]);

  const renderPlayerRow = (player: Player, showBg: boolean = true) => (
    <div className="grid grid-cols-[auto_auto_1fr_auto] gap-2 md:gap-4 items-center py-1.5">
      <div className="text-center min-w-[40px]">
        <span className="text-base font-medium text-white">{player.number}</span>
      </div>
      <div className="text-center min-w-[35px]">
        <span className="text-base font-bold text-white">{player.position}</span>
      </div>
      <div className="flex items-center">
        <span className={`text-base font-medium text-white ${showBg ? 'bg-[#1F1F1F]' : ''} rounded-[10px] px-4 py-1.5 inline-block`}>{player.name}</span>
      </div>
      <div className="text-center min-w-[80px]">
        <span className="text-base font-medium text-white">{player.nationality}</span>
      </div>
    </div>
  );
  const renderCoachRow = (name: string) => (
    <div className="grid grid-cols-[auto_auto_1fr_auto] gap-2 md:gap-4 items-center py-1.5">
      <div className="min-w-[40px]"></div>
      <div className="min-w-[35px]"></div>
      <div className="flex items-center">
        <span className="text-base font-medium text-white bg-[#1F1F1F] rounded-[10px] px-4 py-1.5 inline-block">{name}</span>
      </div>
      <div className="min-w-[80px]"></div>
    </div>
  );

  const safeStartersA = cmStartersA.length ? cmStartersA : (homeLineup.length ? homeLineup : []);
  const safeSubsA = cmSubsA.length ? cmSubsA : [];
  const safeStartersB = cmStartersB.length ? cmStartersB : (awayLineup.length ? awayLineup : []);
  const safeSubsB = cmSubsB.length ? cmSubsB : [];

  if (loading) {
    return (
      <div className="w-full bg-[#18191B] text-white p-6">
        <div className="animate-pulse space-y-6">
          <div className="bg-[#252525] rounded-xl p-6">
            <div className="grid grid-cols-3 gap-6 items-center">
              <div className="h-16 w-16 rounded-full bg-[#303030]"></div>
              <div className="h-10 rounded bg-[#303030]"></div>
              <div className="h-16 w-16 rounded-full bg-[#303030] justify-self-end"></div>
            </div>
          </div>
          <div className="bg-[#252525] rounded-xl p-6">
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-6 rounded bg-[#303030]"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return <div className="text-red-400 p-6">{error}</div>;
  }
  return (
    <div className="w-full bg-[#18191B] text-white overflow-y-auto">
      {/* Match Data Section */}
      <div className="px-4 md:px-6 py-4 md:py-6">
        <h2 className="text-base font-medium text-white mb-4">Match data</h2>
        
        {/* Match Score Card */}
        <div className="bg-[#252525] rounded-xl p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            {/* Left Team */}
            <div className="flex flex-col items-center gap-3 flex-1">
               <img 
                  src={proxiedSrc(cleanMatch?.team_a?.logo || "")} 
                  alt={cleanMatch?.team_a?.name || ""}
                  className="w-14 h-14 rounded-full object-contain bg-[#1B1B1B] p-0.5"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; (e.currentTarget as HTMLImageElement).style.background = '#303030'; }}
                />
              <h3 className="text-base md:text-lg font-bold text-white text-center">
                {cleanMatch?.team_a?.name || ""}
              </h3>
            </div>

            {/* Center - Score and Info */}
            <div className="flex flex-col items-center gap-3 min-w-[200px]">
              <div className="text-xs md:text-sm font-medium text-white text-center px-4">
                {(cleanMatch?.season?.original_name || "")}{" "} {(cleanMatch?.season?.title || "")} / Matchday {cleanMatch?.round?.currentGameweek || ""}
              </div>
              <div className="text-xs md:text-sm font-medium text-white">{cleanMatch?.team_a?.name || ""}  vs  {cleanMatch?.team_b?.name || ""}</div>
              <div className="bg-[#1B1B1B] rounded-xl px-4 md:px-6 py-2 md:py-3">
                <span className="text-xl md:text-2xl font-extrabold text-white">{cleanMatch?.team_a?.score || "0"} - {cleanMatch?.team_b?.score || "0"}</span>
              </div>
              
            </div>

            {/* Right Team */}
            <div className="flex flex-col items-center gap-3 flex-1">
               <img 
                  src={proxiedSrc(cleanMatch?.team_b?.logo || "")} 
                  alt={cleanMatch?.team_b?.name || ""}
                  className="w-14 h-14 rounded-full object-contain bg-[#1B1B1B] p-0.5"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; (e.currentTarget as HTMLImageElement).style.background = '#303030'; }}
                />
              <h3 className="text-base md:text-lg font-bold text-white text-center">
                {cleanMatch?.team_b?.name || ""}
              </h3>
            </div>
          </div>

          {/* Penalty Scores */}
          {/* <div className="mt-6 grid grid-cols-2 gap-2 md:gap-4"> */}
            {/* Penalty */}
            {/* <div className="space-y-1 md:space-y-2">
              <div className="text-xs md:text-sm font-medium text-white text-center">35' A. Ramsdale</div>
              <div className="text-xs md:text-sm font-medium text-white text-center">(P) A. Ramsdale</div>
              <div className="text-xs md:text-sm font-medium text-white text-center">(P) A. Ramsdale</div>
              <div className="text-xs md:text-sm font-medium text-white text-center">41' K. Hein</div>
            </div> */}

            {/* Penalty */}
            {/* <div className="space-y-1 md:space-y-2">
              <div className="text-xs md:text-sm font-medium text-white text-center">83' W. Saliba</div>
              <div className="text-xs md:text-sm font-medium text-white text-center">92' G. Magalhaes</div>
              <div className="text-xs md:text-sm font-medium text-white text-center">(P) W. Saliba</div>
              <div className="text-xs md:text-sm font-medium text-white text-center">(P) G. Magalhaes</div>
              <div className="text-xs md:text-sm font-medium text-white text-center">(P) W. Saliba</div>
              <div className="text-xs md:text-sm font-medium text-white text-center">(P) G. Magalhaes</div>
              <div className="text-xs md:text-sm font-medium text-white text-center">(P) W. Saliba</div>
            </div> */}
          {/* </div> */}
        </div>

        {/* Match Info */}
        <div className="bg-[#252525] rounded-xl p-4 md:p-6 mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="text-white font-semibold">Match info</span>
              <span className="text-gray-300">
                Date: <span className="text-white">{cleanMatch?.date || ""} / {cleanMatch?.time || ""}</span>
              </span>
              <span className="text-gray-300">
                Venue:{" "}
                <span className="text-white">
                  {[(cleanMatch?.venue?.name || ""), (cleanMatch?.venue?.city || ""), (cleanMatch?.venue?.area)].filter(Boolean).join(", ")}
                </span>
              </span>
              {cleanMatch?.venue?.attendance && (
                <span className="text-gray-300">
                  Attendance: <span className="text-white">{cleanMatch?.venue?.attendance}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-300">Main Referee:</span>
              {((cleanMatch?.referees || []).length > 0) ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#00BBFF] to-[#0051FF]"></div>
                  <span className="text-white">
                    {(cleanMatch?.referees || []).find((r: any) => String(r?.role).toLowerCase() === "main_referee")?.name
                      || (cleanMatch?.referees || [])[0]?.name
                      || ""}
                  </span>
                </div>
              ) : (
                <span className="text-white">N/A</span>
              )}
            </div>
          </div>
        </div>
        {/* Match Timeline */}
        {cleanMatch.timeline && cleanMatch.timeline.length>0 &&(<div className="bg-[#252525] rounded-xl p-4 md:p-6 space-y-3 md:space-y-4 max-h-[500px] overflow-y-auto flex flex-col items-center w-full">
          {(() => {
            const sorted = (cleanMatch?.timeline && cleanMatch.timeline.length)
              ? [...cleanMatch.timeline].sort((a: any, b: any) => {
                  const am = parseInt((a.minute || '').replace(/[^0-9]/g, ''), 10) || 0;
                  const bm = parseInt((b.minute || '').replace(/[^0-9]/g, ''), 10) || 0;
                  return bm - am;
                })
              : matchEventsDyn;
            const periods = [
              { key: 'soc_p2s', label: '2nd Half' },
              { key: 'soc_p1s', label: '1st Half' },
            ];
            const renderIconRow = (ev: any) => {
              const typeLower = String(ev.type || "").toLowerCase();
              const isGoal = typeLower === "goal";
              const isPenaltyGoal = typeLower === "penalty_goal";
              const card = ev.type === "card" ? ev.cardType || "" : "";
              const isYellowCard = typeLower === "yellow_card" || (typeLower === "card" && String(card).toLowerCase().includes("yellow"));
              const minute = ev.minute || ev.time || "";
              const player = ev.player || "";
              const subPlayer = ev.subPlayer || "";
              return (
                <div key={`tl-${minute}-${player}`} className="flex items-center gap-4 justify-center w-full">
                  <div title={minute + "minute"} className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center text-white font-bold shrink-0 ">
                    {minute}
                  </div>
                  <div className="flex items-center gap-3">
                    {isPenaltyGoal ? (
                      <div className="w-6 h-6 rounded-full bg-[#00BBFF] flex items-center justify-center" title="Penalty Goal">
                        <span className="text-white text-xs font-extrabold">P</span>
                      </div>
                    ) : isYellowCard ? (
                      <div className="w-6 h-6 flex items-center justify-center" title="Yellow Card">
                        <div className="w-3.5 h-5 bg-[#FFD400] rounded-sm"></div>
                      </div>
                    ) : isGoal ? (
                      <div className="w-6 h-6 rounded-full bg-[#F5A623] flex items-center justify-center">
                        <span className="text-black font-bold" title="Goal">⚽</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5" title="Substitution">
                        <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
                          <path d="M5.75 6.57143L11.5 0L0 0L5.75 6.57143Z" fill="#FF0000"/>
                        </svg>
                        <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
                          <path d="M5.75 0L0 6.57143L11.5 6.57143L5.75 0Z" fill="#2EE500"/>
                        </svg>
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      <span className={`text-sm md:text-base font-medium ${(isGoal || isPenaltyGoal || isYellowCard) ? 'text-white' : 'text-green-400'}`}>{player}</span>
                      {subPlayer && !(isGoal || isPenaltyGoal || isYellowCard) && (
                        <span className="text-sm md:text-base font-medium text-red-400">{subPlayer}</span>
                      )}
                      {(isGoal || isPenaltyGoal) && ev.scoreText && (
                        <span className="text-sm md:text-base font-semibold text-white">({ev.scoreText})</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            };
            return periods.map(({ key, label }) => {
              const evs = sorted.filter((e: any) => String(e.period || '').toLowerCase() === key);
              if (!evs.length) return null;
              const ps = cleanMatch?.periodScores?.[key];
              let home = typeof ps?.a === 'number' ? ps!.a : 0;
              let away = typeof ps?.b === 'number' ? ps!.b : 0;
              if (ps === undefined) {
                for (const e of evs) {
                  const t = String(e.type || '').toLowerCase();
                  if (t === 'goal' || t === 'penalty_goal') {
                    const side = String(e.team || '').toLowerCase();
                    if (side === 'home' || side === 'team_a') home++;
                    else if (side === 'away' || side === 'team_b') away++;
                  }
                }
              }
              return (
                <div key={key} className="w-full">
                  <div className="flex items-center justify-center my-2 w-full">
                    <div className="flex-1 h-px bg-[#18191B]"></div>
                    <div className="mx-4 text-sm md:text-base text-white font-semibold">{label} {home} - {away}</div>
                    <div className="flex-1 h-px bg-[#18191B]"></div>
                  </div>
                  <div className="flex flex-col items-center space-y-3">
                    {evs.map(renderIconRow)}
                  </div>
                </div>
              );
            });
          })()}
        </div>)}
      </div>

      {/* Lineups Section */}
      <div className="px-4 md:px-6 py-4 md:py-6">
        <h2 className="text-base font-medium text-white mb-4">Lineups</h2>
        
        <div className="bg-[#252525] rounded-xl p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Lineup */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <img 
                  src={proxiedSrc(cleanMatch?.team_a?.logo || "")} 
                  alt={cleanMatch?.team_a?.name || ""}
                  className="w-7 h-7 rounded-full object-contain bg-[#1B1B1B] p-0.5 shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; (e.currentTarget as HTMLImageElement).style.background = '#303030'; }}
                />
                <h3 className="text-lg md:text-xl font-extrabold text-white text-center mt-2">
                  {cleanMatch?.team_a?.name || ""}
                </h3>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-[auto_auto_1fr_auto_auto] gap-2 md:gap-4 text-sm font-normal text-white pb-2">
                <div className="text-center min-w-[40px]">#</div>
                <div className="text-center min-w-[35px]">Pos</div>
                <div>Player</div>
                <div className="text-center min-w-[50px]">Nationality</div>
                {/* <div className="text-center min-w-[35px]">Age</div> */}
              </div>

              {/* Starters */}
              <div className="space-y-0.5">
                {safeStartersA.length > 0 ? (
                  safeStartersA.map((player: any, index: number) => (
                    <div key={index}>{renderPlayerRow(toDisplayPlayer(player), true)}</div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm py-2 text-center">No players available</div>
                )}
              </div>

              {/* Substitutes Section */}
              <div className="mt-6 md:mt-8 pt-4 border-t border-[#18191B]">
                <h4 className="text-base font-extrabold text-white mb-3">Substitutes on bench</h4>
                <div className="space-y-0.5">
                  {safeSubsA.length > 0 ? (
                    safeSubsA.map((player: any, index: number) => (
                      <div key={index}>{renderPlayerRow(toDisplayPlayer(player), true)}</div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm py-2 text-center">No substitutes available</div>
                  )}
                </div>
              </div>

              {/* Coach */}
              {cleanMatch?.team_a?.coach?.name &&(<div className="mt-4 md:mt-6 pt-4 border-t border-[#18191B]">
                <h4 className="text-base font-extrabold text-white mb-2">Coach</h4>
                <span className="text-base font-medium text-white">{cleanMatch?.team_a?.coach?.name || ""}</span>       
              </div>)}
            </div>

            {/* Divider */}
            {/* <div className="hidden md:block w-px bg-[#18191B]"></div> */}

            {/* Lineup */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <img 
                  src={proxiedSrc(cleanMatch?.team_b?.logo || "")} 
                  alt={cleanMatch?.team_b?.name || ""}  
                  className="w-7 h-7 rounded-full object-contain bg-[#1B1B1B] p-0.5 shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; (e.currentTarget as HTMLImageElement).style.background = '#303030'; }}
                />
                <h3 className="text-lg md:text-xl font-extrabold text-white text-center mt-2">
                  {cleanMatch?.team_b?.name || ""}
                </h3>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-[auto_auto_1fr_auto_auto] gap-2 md:gap-4 text-sm font-normal text-white pb-2">
                <div className="text-center min-w-[40px]">#</div>
                <div className="text-center min-w-[35px]">Pos</div>
                <div>Player</div>
                <div className="text-center min-w-[50px]">Nationality</div>
                {/* <div className="text-center min-w-[35px]">Age</div> */}
              </div>

              {/* Starters */}
              <div className="space-y-0.5">
                {safeStartersB.length > 0 ? (
                  safeStartersB.map((player: any, index: number) => (
                    <div key={index}>{renderPlayerRow(toDisplayPlayer(player), true)}</div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm py-2 text-center">No players available</div>
                )}
              </div>

              {/* Substitutes Section */}
              <div className="mt-6 md:mt-8 pt-4 border-t border-[#18191B]">
                <h4 className="text-base font-extrabold text-white mb-3">Substitutes on bench</h4>
                <div className="space-y-0.5">
                  {safeSubsB.length > 0 ? (
                    safeSubsB.map((player: any, index: number) => (
                      <div key={index}>{renderPlayerRow(toDisplayPlayer(player), true)}</div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm py-2 text-center">No substitutes available</div>
                  )}
                </div>
              </div>

              {/* Coach */}
              {cleanMatch?.team_b?.coach?.name &&(<div className="mt-4 md:mt-6 pt-4 border-t border-[#18191B]">
                <h4 className="text-base font-extrabold text-white mb-2">Coach</h4>
                <span className="text-base font-medium text-white">{cleanMatch?.team_b?.coach?.name || ""}</span> 
              </div>)}
            </div>
          </div>
        </div>
      </div>

      {/* Squad Data Section */}
      <div className="px-4 md:px-6 py-4 md:py-6">
        <h2 className="text-base font-medium text-white mb-4">Squad data</h2>
        
        <div className="bg-[#252525] rounded-xl p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Squad */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <img 
                  src={proxiedSrc(cleanMatch?.team_a?.logo || "")} 
                  alt={cleanMatch?.team_a?.name || ""}
                  className="w-7 h-7 rounded-full object-contain bg-[#1B1B1B] p-0.5 shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; (e.currentTarget as HTMLImageElement).style.background = '#303030'; }}
                />
                <h3 className="text-lg md:text-xl font-extrabold text-white text-center mt-2">
                  {cleanMatch?.team_a?.name || ""}
                </h3>
              </div>

              {/* Squad List */}
              <div className="space-y-0.5">
                {safeStartersA.length > 0 ? (
                  safeStartersA.map((player: any, index: number) => (
                    <div key={index}>{renderPlayerRow(toDisplayPlayer(player), true)}</div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm py-2 text-center">No squad data available</div>
                )}
              </div>

              {/* Substitutes */}
              <div className="mt-6 md:mt-8 pt-4 border-t border-[#18191B]">
                <h4 className="text-base font-extrabold text-white mb-3">Substitutes</h4>
                <div className="space-y-0.5">
                  {safeSubsA.length > 0 ? (
                    safeSubsA.map((player: any, index: number) => (
                      <div key={index}>{renderPlayerRow(toDisplayPlayer(player), true)}</div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm py-2 text-center">No substitutes available</div>
                  )}
                </div>
              </div>

              {/* Coach */}
              {cleanMatch?.team_a?.coach?.name && <div className="mt-4 md:mt-6 pt-4 border-t border-[#18191B]">
                <h4 className="text-base font-extrabold text-white mb-2">Coach</h4>
                <span className="text-base font-medium text-white">{cleanMatch?.team_a?.coach?.name}</span>
              </div>}

              {/* Ask AI Button */}
              {/* <div className="mt-4 md:mt-6 flex justify-end">
                <button className="bg-white rounded-xl p-3 hover:bg-gray-100 transition-colors" aria-label="Ask AI">
                  <svg width="23" height="22" viewBox="0 0 23 22" fill="none">
                    <path d="M5.02615 18.0513L0 22V1.12821C0 0.828987 0.118864 0.542023 0.330444 0.330444C0.542023 0.118864 0.828987 0 1.12821 0H21.4359C21.7351 0 22.0221 0.118864 22.2337 0.330444C22.4452 0.542023 22.5641 0.828987 22.5641 1.12821V16.9231C22.5641 17.2223 22.4452 17.5093 22.2337 17.7208C22.0221 17.9324 21.7351 18.0513 21.4359 18.0513H5.02615ZM10.1538 12.4103V14.6667H12.4103V12.4103H10.1538ZM7.40892 6.55826L9.62246 7.00164C9.68528 6.68736 9.83605 6.39738 10.0572 6.16543C10.2784 5.93349 10.5609 5.76913 10.8719 5.69146C11.1828 5.6138 11.5094 5.62603 11.8137 5.72674C12.118 5.82744 12.3874 6.01247 12.5906 6.26031C12.7938 6.50815 12.9225 6.80859 12.9616 7.1267C13.0007 7.4448 12.9487 7.76747 12.8116 8.05717C12.6746 8.34687 12.458 8.59169 12.1872 8.76314C11.9165 8.93459 11.6026 9.02562 11.2821 9.02564H10.1538V11.2821H11.2821C12.0298 11.2818 12.7621 11.0693 13.3938 10.6692C14.0255 10.2691 14.5306 9.69781 14.8503 9.02188C15.1701 8.34596 15.2913 7.59314 15.2 6.851C15.1086 6.10886 14.8085 5.40791 14.3344 4.82968C13.8603 4.25145 13.2317 3.81973 12.5219 3.58472C11.812 3.3497 11.0501 3.32107 10.3246 3.50215C9.59909 3.68323 8.93993 4.06658 8.42378 4.60759C7.90763 5.14861 7.5557 5.82506 7.40892 6.55826Z" fill="url(#paint0_linear)"/>
                    <defs>
                      <linearGradient id="paint0_linear" x1="30.8" y1="11.1305" x2="7.7463" y2="-4.30979" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#00BBFF"/>
                        <stop offset="1" stopColor="#0051FF"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </button>
              </div> */}
            </div>

            {/* Divider */}
            {/* <div className="hidden lg:block w-px bg-[#18191B]"></div> */}

            {/* Squad */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <img 
                  src={proxiedSrc(cleanMatch?.team_b?.logo || "")} 
                  alt={cleanMatch?.team_b?.name || ""}  
                  className="w-7 h-7 rounded-full object-contain bg-[#1B1B1B] p-0.5 shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; (e.currentTarget as HTMLImageElement).style.background = '#303030'; }}
                />
                <h3 className="text-lg md:text-xl font-extrabold text-white text-center mt-2">
                  {cleanMatch?.team_b?.name || ""}
                  {/* className="w-7 h-7 rounded-full object-cover" */}
                </h3>
              </div>

              {/* Squad List */}
              <div className="space-y-0.5">
                {((cmStartersB.length ? cmStartersB : (awayLineup.length ? awayLineup : ""))).map((player: any, index: number) => (
                  <div key={index}>{renderPlayerRow(toDisplayPlayer(player), true)}</div>
                ))}
              </div>

              {/* Substitutes */}
              <div className="mt-6 md:mt-8 pt-4 border-t border-[#18191B]">
                <h4 className="text-base font-extrabold text-white mb-3">Substitutes</h4>
                <div className="space-y-0.5">
                  {safeSubsB.length > 0 ? (
                    safeSubsB.map((player: any, index: number) => (
                      <div key={index}>{renderPlayerRow(toDisplayPlayer(player), true)}</div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm py-2 text-center">No substitutes available</div>
                  )}
                </div>
              </div>

              {/* Coach */}
              {cleanMatch?.team_b?.coach?.name && (<div className="mt-4 md:mt-6 pt-4 border-t border-[#18191B]">
                <h4 className="text-base font-extrabold text-white mb-2">Coach</h4>
                <span className="text-base font-medium text-white">{cleanMatch?.team_b?.coach?.name || ""}</span>
                {/* {renderCoachRow(cleanMatch?.team_b?.coach?.name || "")} */}
              </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetadataTab;
