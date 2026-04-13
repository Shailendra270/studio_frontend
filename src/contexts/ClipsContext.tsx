import React, { useMemo, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTags, TagData } from "@/api/tagsApi";
import { fetchTeams, selectTeams } from "@/store/slices/teamsSlice";
import { RootState } from "@/store";
import { selectUser } from "@/store/slices/authSlice";
import { ClipsContext, ClipsContextValue } from "./ClipsContextBase";

export const ClipsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const { currentStream } = useSelector((state: RootState) => state.streams);
  const teams = useSelector(selectTeams);
  const user = useSelector(selectUser);

  const category = currentStream?.category || "";
  const streamId = currentStream?.streamId || "";
  const t1Id = currentStream?.team1Id;
  const t2Id = currentStream?.team2Id;

  const playerIds = useMemo(() => {
    if (!currentStream) return [];
    if (!t1Id && !t2Id) return [];
    const findTeam = (id?: string) => {
      if (!id) return undefined;
      return teams.find((t: any) => t.id === id || t._id === id);
    };
    const team1 = findTeam(t1Id);
    const team2 = findTeam(t2Id);
    const ids = [...(team1?.playerIds || []), ...(team2?.playerIds || [])];
    return Array.from(new Set(ids));
  }, [currentStream, teams, t1Id, t2Id]);
  const [eventTags, setEventTags] = useState<TagData[]>([]);
  const [playerTags, setPlayerTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  // Ensure teams are available when stream references them
  useEffect(() => {
    if (!category || !user?.userId) return;
    if (!t1Id && !t2Id) return;
    const hasTeam = (id?: string) => {
      if (!id) return true;
      return teams.some((t: any) => t.id === id || t._id === id);
    };
    const needFetch = !hasTeam(t1Id) || !hasTeam(t2Id);
    if (needFetch) {
      (dispatch as any)(fetchTeams({ category, limit: 500, userId: user.userId }));
    }
  }, [dispatch, category, user?.userId, t1Id, t2Id, teams]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!category) {
        setEventTags([]);
        setPlayerTags([]);
        return;
      }
      const teamIdsPresent = Boolean(t1Id || t2Id);
      // Skip player fetch until playerIds are available when stream references teams
      const shouldSkipPlayerFetch = teamIdsPresent && playerIds.length;

      setLoading(true);
      try {
        const ev = await getTags({ category, tagType: "event", userId: user?.userId || '', limit: 100, pageNo: 1 });
        let filteredPlayers: TagData[] = [];
        if (shouldSkipPlayerFetch) {
          const pl = await getTags({ category, tagType: "player", playerIds, userId: user?.userId || '', limit: 100, pageNo: 1 });
          const data = pl.success ? (pl.data || []) : [];
          filteredPlayers =
            playerIds && playerIds.length > 0
              ? data.filter((t: any) => playerIds.includes(String(t._id || t.id)))
              : [];
        }
        if (!cancelled) {
          setEventTags(ev.success ? (ev.data || []) : []);
          setPlayerTags(filteredPlayers);
        }
      } catch {
        if (!cancelled) {
          setEventTags([]);
          setPlayerTags([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [category, streamId, playerIds, refreshKey, t1Id, t2Id]);

  const value: ClipsContextValue = {
    category,
    streamId,
    eventTags,
    playerTags,
    loading,
    refresh,
  };

  return <ClipsContext.Provider value={value}>{children}</ClipsContext.Provider>;
};
