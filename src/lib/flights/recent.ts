import type { FlightSearch } from "./types";

const KEY = "tbils.recentSearches";

/** Last few searches made in this browser (newest first), for the dashboard's "Recent searches". */
export function recentSearches(): FlightSearch[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as FlightSearch[];
  } catch {
    return [];
  }
}

export function rememberSearch(s: FlightSearch) {
  try {
    const key = JSON.stringify(s);
    const list = [s, ...recentSearches().filter((x) => JSON.stringify(x) !== key)].slice(0, 6);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}
