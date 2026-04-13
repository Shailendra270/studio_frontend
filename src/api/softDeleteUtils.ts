export const SOFT_DELETE_GRACE_DAYS = 15;

export function computeSoftDeleteMeta(deletedAtIso?: string | null) {
  if (!deletedAtIso) {
    return {
      deletedDaysAgo: null as number | null,
      remainingDays: null as number | null,
    };
  }

  const deletedAt = new Date(deletedAtIso);
  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const daysAgo = Math.floor((now.getTime() - deletedAt.getTime()) / oneDayMs);

  const deadline = new Date(deletedAt.getTime() + SOFT_DELETE_GRACE_DAYS * oneDayMs);
  const diff = deadline.getTime() - now.getTime();
  const remainingDays = diff <= 0 ? 0 : Math.ceil(diff / oneDayMs);

  return {
    deletedDaysAgo: daysAgo < 0 ? 0 : daysAgo,
    remainingDays,
  };
}

