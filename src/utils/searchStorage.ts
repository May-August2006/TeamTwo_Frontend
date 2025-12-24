/** @format */

import type { UnitSearchParams } from "../types/unit";

const KEY = "tenant_unit_searches";

export const saveSearch = (params: UnitSearchParams) => {
  const existing = JSON.parse(
    localStorage.getItem(KEY) || "[]"
  ) as UnitSearchParams[];

  const updated = [params, ...existing].slice(0, 5);
  localStorage.setItem(KEY, JSON.stringify(updated));
};

export const getSavedSearches = (): UnitSearchParams[] => {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
};
