export const productKeys = [
  "maintenance",
  "computers",
  "networks",
  "security",
  "consulting",
] as const;

export type ProductKey = (typeof productKeys)[number];

export interface PaymentOption {
  key: string;
  minutes?: number;
  amountCents: number;
  currency: "EUR";
  paymentUrl: string;
}

export interface Product {
  key: ProductKey;
  paymentOptions: readonly PaymentOption[];
}

export const products: readonly Product[] = Object.freeze([
  {
    key: "maintenance",
    paymentOptions: [
      {
        key: "maintenance",
        amountCents: 4_000,
        currency: "EUR",
        paymentUrl: "https://buy.stripe.com/dRm8wH8lDf0KfxG8OO97G07",
      },
    ],
  },
  {
    key: "computers",
    paymentOptions: [
      {
        key: "computers",
        amountCents: 16_000,
        currency: "EUR",
        paymentUrl: "https://buy.stripe.com/7sYcMXcBT5qa99i8OO97G04",
      },
    ],
  },
  {
    key: "networks",
    paymentOptions: [
      {
        key: "networks",
        amountCents: 7_000,
        currency: "EUR",
        paymentUrl: "https://buy.stripe.com/bJefZ96dv3i21GQaWW97G05",
      },
    ],
  },
  {
    key: "security",
    paymentOptions: [
      {
        key: "security",
        amountCents: 8_000,
        currency: "EUR",
        paymentUrl: "https://buy.stripe.com/28E00b0Tb2dYetCc1097G06",
      },
    ],
  },
  {
    key: "consulting",
    paymentOptions: [
      {
        key: "consulting_30",
        minutes: 30,
        amountCents: 2_200,
        currency: "EUR",
        paymentUrl: "https://book.stripe.com/6oU3cn6dv9Gq5X6aWW97G08",
      },
      {
        key: "consulting_60",
        minutes: 60,
        amountCents: 4_300,
        currency: "EUR",
        paymentUrl: "https://book.stripe.com/aFa9AL6dv05Q5X6aWW97G0a",
      },
      {
        key: "consulting_90",
        minutes: 90,
        amountCents: 6_600,
        currency: "EUR",
        paymentUrl: "https://book.stripe.com/28EdR131j7yigBK8OO97G09",
      },
    ],
  },
]);

export function formatProductPrice(
  amountCents: number,
  locale: string | undefined,
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amountCents / 100);
  } catch {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amountCents / 100);
  }
}
