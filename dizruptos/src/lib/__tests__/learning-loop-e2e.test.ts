import { describe, it, expect } from "vitest";
import {
  recommendationsIntel,
  transitionRecommendation,
  learningIntelligence,
} from "@/server/services/intelligence-loader";

// Exercises the full closed loop against the in-memory backend (demo mode):
// observe → recommend → persist → accept (prediction writeback) → complete →
// measure (accuracy) → calibrate. No mocks: the real loaders + repository.

const actor = { id: "u-test", role: "executive" as const, name: "Test Exec" };

describe("learning loop (end-to-end via loaders)", () => {
  it("persists computed recommendations as pending entities", async () => {
    const { recommendations } = await recommendationsIntel();
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.every((r) => r.status === "pending")).toBe(true);
    expect(recommendations[0].nextStates).toContain("accepted");
  });

  it("writes back a prediction on accept and scores accuracy on measure", async () => {
    const { recommendations } = await recommendationsIntel();
    const target = recommendations[0];

    // ACCEPT → prediction written
    const accepted = await transitionRecommendation(target.id, "accepted", actor, { confidence: 0.7 });
    expect(accepted.status).toBe("accepted");
    expect(accepted.confidence).toBe(0.7);
    expect(accepted.baselineValue).not.toBeNull();
    expect(accepted.expectedDelta).not.toBeNull();
    expect(accepted.acceptedAt).not.toBeNull();

    // COMPLETE
    const completed = await transitionRecommendation(target.id, "completed", actor);
    expect(completed.status).toBe("completed");

    // MEASURE → actual recorded, accuracy scored
    const baseline = accepted.baselineValue ?? 0;
    const measured = await transitionRecommendation(target.id, "measured", actor, { actualValue: Math.max(0, baseline - (accepted.expectedDelta ?? 0)) });
    expect(measured.status).toBe("measured");
    expect(measured.actualValue).not.toBeNull();
    expect(measured.accuracy).toBe(1); // we made the prediction come true exactly
    expect(measured.measuredAt).not.toBeNull();
  });

  it("rejects invalid lifecycle transitions", async () => {
    const { recommendations } = await recommendationsIntel();
    // a still-pending rec cannot jump straight to measured
    const pending = recommendations.find((r) => r.status === "pending");
    expect(pending).toBeTruthy();
    await expect(
      transitionRecommendation(pending!.id, "measured", actor)
    ).rejects.toThrow(/cannot move/i);
  });

  it("feeds calibration from the measured recommendation", async () => {
    const learn = await learningIntelligence();
    expect(learn.calibration.observed).toBeGreaterThanOrEqual(1);
    expect(learn.recommendationAccuracy).not.toBeNull();
    expect(learn.lifecycle.measured).toBeGreaterThanOrEqual(1);
    // velocity = measured / accepted is computable once something is acted on
    expect(learn.velocity.measuredOfAccepted).not.toBeNull();
  });
});
