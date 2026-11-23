import { describe, it, expect } from "vitest";
import { buildReminderSchedule } from "@/lib/extraction/reminders";

describe("buildReminderSchedule", () => {
  it("schedules 7d, 3d, 1d, and morning-of reminders for a future date", () => {
    const now = new Date("2026-11-01T09:00:00Z");
    const reminders = buildReminderSchedule("2026-11-15", 8, now);

    expect(reminders).toHaveLength(4);
    expect(reminders[0]).toEqual({
      trigger_at: "2026-11-08T08:00:00.000Z",
      channel: "email_digest",
    });
    expect(reminders[3]).toEqual({
      trigger_at: "2026-11-15T08:00:00.000Z",
      channel: "web_push",
    });
  });

  it("skips reminders that are already in the past", () => {
    const now = new Date("2026-11-13T10:00:00Z");
    const reminders = buildReminderSchedule("2026-11-15", 8, now);

    expect(reminders).toHaveLength(2);
    expect(reminders.map((r) => r.trigger_at)).toEqual([
      "2026-11-14T08:00:00.000Z",
      "2026-11-15T08:00:00.000Z",
    ]);
  });

  it("returns empty list for null or invalid dates", () => {
    expect(buildReminderSchedule(null)).toEqual([]);
    expect(buildReminderSchedule("not-a-date")).toEqual([]);
  });
});
