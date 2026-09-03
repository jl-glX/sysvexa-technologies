import type { TFunction } from "i18next";
import { Check } from "lucide-react";
import {
  formatProductPrice,
  products,
  type ProductKey,
} from "../lib/products";

interface ProductSelectorProps {
  locale: string | undefined;
  selectedProduct: ProductKey | "";
  selectedOption: string;
  setSelectedProduct: (product: ProductKey) => void;
  setSelectedOption: (option: string) => void;
  t: TFunction;
}

export function ProductSelector({
  locale,
  selectedProduct,
  selectedOption,
  setSelectedProduct,
  setSelectedOption,
  t,
}: ProductSelectorProps) {
  const consulting = products.find((product) => product.key === "consulting");

  return (
    <fieldset className="product-selector">
      <legend>{t("request.service")}</legend>
      <div className="product-choice-grid">
        {products.map((product) => {
          const selected = selectedProduct === product.key;
          const priceSummary = product.paymentOptions
            .map((option) => formatProductPrice(option.amountCents, locale))
            .join(" · ");
          return (
            <label className={selected ? "product-choice is-selected" : "product-choice"} key={product.key}>
              <input
                type="radio"
                name="service"
                value={product.key}
                checked={selected}
                onChange={() => {
                  setSelectedProduct(product.key);
                  if (product.key !== "consulting") setSelectedOption("");
                }}
                required
              />
              <span className="product-choice-check"><Check size={13} /></span>
              <strong>{t(`services.${product.key}.title`)}</strong>
              <small>{priceSummary}</small>
            </label>
          );
        })}
      </div>
      {selectedProduct === "consulting" && consulting && (
        <fieldset className="consulting-options">
          <legend>{t("request.consultingDuration")}</legend>
          <div>
            {consulting.paymentOptions.map((option) => (
              <label className={selectedOption === option.key ? "is-selected" : ""} key={option.key}>
                <input
                  type="radio"
                  name="productOption"
                  value={option.key}
                  checked={selectedOption === option.key}
                  onChange={() => setSelectedOption(option.key)}
                  required
                />
                <span>{option.minutes} min</span>
                <strong>{formatProductPrice(option.amountCents, locale)}</strong>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </fieldset>
  );
}
