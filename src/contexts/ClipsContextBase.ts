import { createContext } from "react";
import { TagData } from "@/api/tagsApi";

export interface ClipsContextValue {
  category?: string;
  streamId?: string;
  eventTags: TagData[];
  playerTags: TagData[];
  loading: boolean;
  refresh: () => void;
}

export const ClipsContext = createContext<ClipsContextValue>({
  category: undefined,
  streamId: undefined,
  eventTags: [],
  playerTags: [],
  loading: false,
  refresh: () => {},
});

