/**
 * Safe API error responses (bead hustle-4dc.3).
 */
import { describe, it, expect, vi } from "vitest";
import { serverError, isStripeCardError, toError, newCorrelationId } from "./errors";

describe("serverError", () => {
  it("returns a generic message plus a correlation id and never the internal text", async () => {
    const logger = { error: vi.fn() };
    const res = serverError(logger, "Checkout failed", new Error("SQLITE_BUSY: database is locked"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("INTERNAL_ERROR");
    expect(body.message).toBe("Something went wrong on our end. Please try again.");
    expect(body.correlationId).toMatch(/^[0-9a-f]{8}$/);
    expect(JSON.stringify(body)).not.toContain("SQLITE_BUSY");
  });

  it("logs the real error with the same correlation id the client sees", async () => {
    const logger = { error: vi.fn() };
    const cause = new Error("stripe secret key invalid");
    const body = await serverError(logger, "Portal failed", cause).json();

    expect(logger.error).toHaveBeenCalledWith("Portal failed", cause, { correlationId: body.correlationId });
  });

  it("accepts a caller message and status", async () => {
    const logger = { error: vi.fn() };
    const res = serverError(logger, "x", "boom", "Could not start checkout. Please try again.", 502);
    expect(res.status).toBe(502);
    expect((await res.json()).message).toBe("Could not start checkout. Please try again.");
  });
});

describe("isStripeCardError", () => {
  it("is true only for Stripe card errors, which are written for the cardholder", () => {
    expect(isStripeCardError({ type: "StripeCardError", message: "Your card was declined." })).toBe(true);
    expect(isStripeCardError({ type: "StripeAPIError", message: "internal" })).toBe(false);
    expect(isStripeCardError(new Error("nope"))).toBe(false);
    expect(isStripeCardError(null)).toBe(false);
  });
});

describe("helpers", () => {
  it("wraps non-Errors and makes distinct ids", () => {
    expect(toError("plain string")).toBeInstanceOf(Error);
    expect(newCorrelationId()).not.toBe(newCorrelationId());
  });
});
