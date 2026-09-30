import { describe, expect, it } from "vitest";

import { allowMessage, createRateBucket, isWithinSizeLimit, MAX_MESSAGE_BYTES } from "./limits";

const RATE = 60;

describe("allowMessage", () => {
  it("allows a burst up to the per-second rate, then drops the excess", () => {
    let bucket = createRateBucket(RATE, 0);
    let allowed = 0;
    for (let i = 0; i < RATE * 3; i++) {
      const result = allowMessage(bucket, 0, RATE);
      bucket = result.bucket;
      if (result.allowed) allowed += 1;
    }
    expect(allowed).toBe(RATE);
  });

  it("refills over time", () => {
    let bucket = createRateBucket(RATE, 0);
    for (let i = 0; i < RATE; i++) bucket = allowMessage(bucket, 0, RATE).bucket;
    expect(allowMessage(bucket, 0, RATE).allowed).toBe(false);
    // Half a second later, half the rate is available again.
    let allowed = 0;
    for (let i = 0; i < RATE; i++) {
      const result = allowMessage(bucket, 500, RATE);
      bucket = result.bucket;
      if (result.allowed) allowed += 1;
    }
    expect(allowed).toBe(RATE / 2);
  });

  it("never stores more than one second of messages", () => {
    const idle = createRateBucket(RATE, 0);
    let bucket = allowMessage(idle, 60_000, RATE).bucket;
    let allowed = 1;
    for (let i = 0; i < RATE * 2; i++) {
      const result = allowMessage(bucket, 60_000, RATE);
      bucket = result.bucket;
      if (result.allowed) allowed += 1;
    }
    expect(allowed).toBe(RATE);
  });
});

describe("isWithinSizeLimit", () => {
  it("accepts normal messages and rejects oversized ones", () => {
    expect(isWithinSizeLimit(200)).toBe(true);
    expect(isWithinSizeLimit(MAX_MESSAGE_BYTES)).toBe(true);
    expect(isWithinSizeLimit(MAX_MESSAGE_BYTES + 1)).toBe(false);
  });
});
