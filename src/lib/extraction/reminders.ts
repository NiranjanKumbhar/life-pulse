export interface ScheduledReminderInput {
  trigger_at: string;
  channel: "web_push" | "email_digest";
}

/**
 * Generates deterministic reminder timestamps (e.g. 3 days before + morning of)
 * for an extracted action_date or expiry_date. Only returns future triggers.
 */
export function buildReminderSchedule(
  targetIsoDate: string | null,
  digestHourUtc = 8,
  now: Date = new Date()
): ScheduledReminderInput[] {
  if (!targetIsoDate) return [];
  const base = new Date(`${targetIsoDate}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) return [];

  const offsetsDays = [7, 3, 1, 0];
  const reminders: ScheduledReminderInput[] = [];

  for (const offset of offsetsDays) {
    const trigger = new Date(base.getTime());
    trigger.setUTCDate(trigger.getUTCDate() - offset);
    trigger.setUTCHours(digestHourUtc, 0, 0, 0);

    if (trigger.getTime() > now.getTime()) {
      reminders.push({
        trigger_at: trigger.toISOString(),
        channel: offset <= 1 ? "web_push" : "email_digest",
      });
    }
  }

  return reminders;
}
