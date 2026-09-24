/**
 * Cross-family access tests for the query-layer ownership guard.
 *
 * Two families are seeded. For every athlete-scoped query module, family B
 * must be refused when it passes family A's playerId, for reads AND writes,
 * while family A keeps normal access.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, seedBaseHierarchy, type TestDB } from "@/test-utils/db";

describe("query-layer ownership guard", () => {
  let testDb: TestDB;
  let close: () => void;
  let a: { userId: string; playerId: string };
  let b: { userId: string; playerId: string };
  let own: typeof import("./ownership");

  beforeEach(async () => {
    vi.resetModules();
    ({ db: testDb, close } = makeTestDb());
    mockDbModule(testDb);
    a = await seedBaseHierarchy(testDb);
    b = await seedBaseHierarchy(testDb);
    own = await import("./ownership");
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
  });

  async function expectRefused(promise: Promise<unknown>) {
    await expect(promise).rejects.toMatchObject({ name: "PlayerAccessError", code: "PLAYER_NOT_OWNED" });
  }

  it("assertPlayerOwnedBy accepts the owner and refuses everyone else", async () => {
    await expect(own.assertPlayerOwnedBy(a.userId, a.playerId)).resolves.toBeUndefined();
    await expectRefused(own.assertPlayerOwnedBy(b.userId, a.playerId));
    await expectRefused(own.assertPlayerOwnedBy(a.userId, "no-such-player"));
    await expectRefused(own.assertPlayerOwnedBy("", a.playerId));
  });

  it("refuses cross-family reads in every athlete-scoped module", async () => {
    const [bio, wo, cardio, practice, journal, meals, gym, games, assess] = await Promise.all([
      import("./biometrics"), import("./workout-logs"), import("./cardio-logs"),
      import("./practice-logs"), import("./journal"), import("./meal-logs"),
      import("./dream-gym"), import("./games"), import("./assessments"),
    ]);
    const u = b.userId, p = a.playerId;
    await expectRefused(bio.getBiometricsLogsAdmin(u, p));
    await expectRefused(wo.getWorkoutLogsAdmin(u, p));
    await expectRefused(cardio.getCardioLogsAdmin(u, p));
    await expectRefused(practice.getPracticeLogsAdmin(u, p));
    await expectRefused(journal.getJournalEntriesAdmin(u, p));
    await expectRefused(meals.getMealLogsAdmin(u, p));
    await expectRefused(gym.getDreamGymAdmin(u, p));
    await expectRefused(games.getAllGamesForPlayerAdmin(u, p));
    await expectRefused(assess.getAssessmentsAdmin(u, p));
  });

  it("refuses cross-family writes and leaves the owner's data untouched", async () => {
    const bio = await import("./biometrics");
    const log = await bio.createBiometricsLogAdmin(a.userId, a.playerId, {
      date: new Date("2026-05-01").toISOString(),
      restingHeartRate: 55,
      source: "manual",
    });

    await expectRefused(
      bio.createBiometricsLogAdmin(b.userId, a.playerId, {
        date: new Date("2026-05-02").toISOString(),
        restingHeartRate: 99,
        source: "manual",
      }),
    );
    await expectRefused(bio.deleteBiometricsLogAdmin(b.userId, a.playerId, log.id));

    const stillThere = await bio.getBiometricsLogsAdmin(a.userId, a.playerId);
    expect(stillThere.logs.map((l) => l.id)).toEqual([log.id]);
  });

  it("refuses schedule events that reference another family's athlete", async () => {
    const sched = await import("./schedule-events");
    const input = { type: "practice", title: "Session", date: new Date("2026-05-03").toISOString() };
    await expectRefused(sched.createScheduleEventAdmin(b.userId, { ...input, playerIds: [a.playerId] } as never));
    await expectRefused(sched.createScheduleEventAdmin(b.userId, { ...input, playerIds: [b.playerId, a.playerId] } as never));
    const ok = await sched.createScheduleEventAdmin(b.userId, { ...input, playerIds: [b.playerId] } as never);
    await expectRefused(sched.updateScheduleEventAdmin(b.userId, ok.id, { playerIds: [a.playerId] } as never));
  });

  it("still serves each family its own athlete", async () => {
    const bio = await import("./biometrics");
    await expect(bio.getBiometricsLogsAdmin(b.userId, b.playerId)).resolves.toMatchObject({ logs: [] });
  });
});
