/**
 * Safe API error responses (bead hustle-4dc.3).
 *
 * Internal failure text (SQLite messages, Stripe internals, stack traces, env
 * var names) must never reach a client. Routes log the real error with a short
 * correlation id and return a generic message carrying the same id, so support
 * can find the log line without the browser ever seeing the internals.
 *
 * Stripe *card* errors are the one exception: those messages are written by
 * Stripe for the cardholder ("Your card was declined"), so they pass through.
 */

import crypto from "node:crypto";
import { NextResponse } from "next/server";

export interface ErrorLogger {
  error: (message: string, error?: Error, context?: Record<string, unknown>) => void;
}

export function newCorrelationId(): string {
  return crypto.randomBytes(4).toString("hex");
}

export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Log the real error, return a generic 500 with a correlation id.
 * `message` is the user-facing sentence; keep it free of internals.
 */
export function serverError(
  logger: ErrorLogger,
  logMessage: string,
  error: unknown,
  message = "Something went wrong on our end. Please try again.",
  status = 500,
): NextResponse {
  const correlationId = newCorrelationId();
  logger.error(logMessage, toError(error), { correlationId });
  return NextResponse.json({ error: "INTERNAL_ERROR", message, correlationId }, { status });
}

/** True for Stripe errors whose message is written for the cardholder. */
export function isStripeCardError(error: unknown): error is { type: string; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { type?: unknown }).type === "StripeCardError" &&
    typeof (error as { message?: unknown }).message === "string"
  );
}
