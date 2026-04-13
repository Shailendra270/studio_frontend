export function truncateText(text: string, maxLength: number = 25): string {
  const t = String(text || "");
  if (t.length <= maxLength) return t;
  return t.substring(0, maxLength) + "...";
}

const ACTIONS_NAMING_USER_IDS = new Set<string>(["q4TfwSsdi"]);

export function shouldUseActionsNaming(userId?: string | null): boolean {
  const id = String(userId || "").trim();
  if (!id) return false;
  return ACTIONS_NAMING_USER_IDS.has(id);
}
