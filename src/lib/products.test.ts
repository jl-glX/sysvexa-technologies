import { describe, expect, it } from "vitest";
import { products } from "./products";

describe("public product catalog", () => {
  it("exposes one unique Stripe Payment Link per fixed price", () => {
    const paymentOptions = products.flatMap((product) => product.paymentOptions);
    expect(paymentOptions).toHaveLength(7);
    expect(new Set(paymentOptions.map((option) => option.paymentUrl)).size).toBe(7);
    expect(paymentOptions.every((option) => option.paymentUrl.startsWith("https://"))).toBe(true);
  });

  it("offers exactly the three fixed consulting prices", () => {
    const consulting = products.find((product) => product.key === "consulting");
    expect(consulting?.paymentOptions.map(({ minutes, amountCents }) => ({ minutes, amountCents }))).toEqual([
      { minutes: 30, amountCents: 2_200 },
      { minutes: 60, amountCents: 4_300 },
      { minutes: 90, amountCents: 6_600 },
    ]);
  });
});
