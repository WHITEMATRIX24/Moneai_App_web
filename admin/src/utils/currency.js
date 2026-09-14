// src/utils/currency.js

import { useState, useEffect, useCallback } from "react";

export const SUPPORTED_CURRENCIES = [
  { code: "INR", symbol: "₹", label: "INR - Indian Rupee", locale: "en-IN" },
  { code: "USD", symbol: "$", label: "USD - US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", label: "EUR - Euro", locale: "de-DE" },
  { code: "GBP", symbol: "£", label: "GBP - British Pound", locale: "en-GB" },
  { code: "JPY", symbol: "¥", label: "JPY - Japanese Yen", locale: "ja-JP" },
  { code: "CAD", symbol: "CA$", label: "CAD - Canadian Dollar", locale: "en-CA" },
  { code: "AUD", symbol: "A$", label: "AUD - Australian Dollar", locale: "en-AU" },
];

const CURRENCY_MAP = SUPPORTED_CURRENCIES.reduce((acc, curr) => {
  acc[curr.code] = curr;
  return acc;
}, {});

export function getActiveCurrency() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = window.localStorage.getItem("mone_currency");
      if (saved && CURRENCY_MAP[saved.toUpperCase()]) {
        return saved.toUpperCase();
      }
    }
  } catch (e) {
    console.error("Failed to read mone_currency from localStorage:", e);
  }
  return "INR";
}

export function setActiveCurrency(currencyCode) {
  if (!currencyCode) return;
  const upper = String(currencyCode).toUpperCase().trim();
  const valid = CURRENCY_MAP[upper] ? upper : "INR";

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("mone_currency", valid);
    }
  } catch (e) {
    console.error("Failed to save mone_currency in localStorage:", e);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("mone_currency_changed", {
        detail: { currency: valid, symbol: getCurrencySymbol(valid) },
      })
    );
  }
}

export function getCurrencySymbol(currencyCode = null) {
  const code = currencyCode ? String(currencyCode).toUpperCase() : getActiveCurrency();
  return CURRENCY_MAP[code]?.symbol || "₹";
}

export function formatCurrency(amount, currencyCode = null, options = {}) {
  const opts = (options && typeof options === "object") ? options : {};
  const num = Number(amount || 0);
  const code = currencyCode ? String(currencyCode).toUpperCase() : getActiveCurrency();
  const config = CURRENCY_MAP[code] || CURRENCY_MAP.INR;

  const fractionDigits =
    typeof opts.fractionDigits === "number"
      ? opts.fractionDigits
      : code === "JPY"
      ? 0
      : 2;

  try {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      ...opts,
    }).format(num);
  } catch (error) {
    return `${config.symbol}${num.toLocaleString()}`;
  }
}

export const USD_EXCHANGE_RATES = {
  USD: 1.0,
  INR: 86.5,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 155.0,
  CAD: 1.38,
  AUD: 1.54,
};

export function convertFromUSD(amountInUSD, targetCurrency = null) {
  const code = targetCurrency ? String(targetCurrency).toUpperCase() : getActiveCurrency();
  const rate = USD_EXCHANGE_RATES[code] || 1.0;
  return Number(amountInUSD || 0) * rate;
}

export function formatCostFromUSD(amountInUSD, targetCurrencyOrOptions = null, maybeOptions = {}) {
  let targetCurrency = null;
  let options = {};

  if (targetCurrencyOrOptions && typeof targetCurrencyOrOptions === "object") {
    options = targetCurrencyOrOptions;
  } else {
    targetCurrency = targetCurrencyOrOptions;
    if (maybeOptions && typeof maybeOptions === "object") {
      options = maybeOptions;
    }
  }

  const code = targetCurrency ? String(targetCurrency).toUpperCase() : getActiveCurrency();
  const converted = convertFromUSD(amountInUSD, code);
  return formatCurrency(converted, code, options);
}

/**
 * React hook that returns active currency and re-renders when currency changes anywhere in the app
 */
export function useCurrency() {
  const [currency, setCurrencyState] = useState(getActiveCurrency);

  useEffect(() => {
    function handleCurrencyChange(event) {
      const next = event?.detail?.currency || getActiveCurrency();
      setCurrencyState(next);
    }

    function handleStorageChange(event) {
      if (event.key === "mone_currency") {
        setCurrencyState(getActiveCurrency());
      }
    }

    window.addEventListener("mone_currency_changed", handleCurrencyChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("mone_currency_changed", handleCurrencyChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const changeCurrency = useCallback((newCode) => {
    setActiveCurrency(newCode);
    setCurrencyState(newCode);
  }, []);

  const format = useCallback(
    (amount, options) =>
      formatCurrency(
        amount,
        currency,
        options && typeof options === "object" ? options : {}
      ),
    [currency]
  );

  const formatCost = useCallback(
    (amountInUSD, maybeCodeOrOpts, maybeOpts) => {
      let targetCode = currency;
      let opts = {};

      if (maybeCodeOrOpts && typeof maybeCodeOrOpts === "object") {
        opts = maybeCodeOrOpts;
      } else if (typeof maybeCodeOrOpts === "string") {
        targetCode = maybeCodeOrOpts;
        if (maybeOpts && typeof maybeOpts === "object") {
          opts = maybeOpts;
        }
      } else if (maybeOpts && typeof maybeOpts === "object") {
        opts = maybeOpts;
      }

      return formatCostFromUSD(amountInUSD, targetCode, opts);
    },
    [currency]
  );

  const convertCost = useCallback(
    (amountInUSD) => convertFromUSD(amountInUSD, currency),
    [currency]
  );

  return {
    currency,
    setCurrency: changeCurrency,
    formatCurrency: format,
    formatCostFromUSD: formatCost,
    convertFromUSD: convertCost,
    currencySymbol: getCurrencySymbol(currency),
    symbol: getCurrencySymbol(currency),
    supportedCurrencies: SUPPORTED_CURRENCIES,
  };
}
