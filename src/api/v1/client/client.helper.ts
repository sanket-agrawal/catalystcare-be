export function getClientBookingPermissions(startDateTime: Date) {
  const now = new Date();
  const diffMs = startDateTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  const canJoin = diffHours <= 0.25 && diffHours >= 0; 
  const canReschedule = diffHours >= 12;
  const canCancel = diffHours >= 24;

  return {
    canJoin,
    canReschedule,
    canCancel,
    diffHours: Math.floor(diffHours),
  };
}
