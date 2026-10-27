// MOCK geography for the fake flight generator: approximate coordinates and UTC offsets
// (standard time) per airport, used only to derive believable durations and local times.

type Geo = [lat: number, lon: number, utcOffset: number];

export const airportGeo: Record<string, Geo> = {
  // Nigeria (UTC+1)
  LOS: [6.58, 3.32, 1], ABV: [9.01, 7.26, 1], PHC: [5.01, 6.95, 1], KAN: [12.05, 8.52, 1], ENU: [6.47, 7.56, 1],
  QOW: [5.43, 7.21, 1], CBQ: [4.98, 8.35, 1], QUO: [4.87, 8.09, 1], BNI: [6.32, 5.6, 1], IBA: [7.36, 3.98, 1],
  ILR: [8.44, 4.49, 1], KAD: [10.7, 7.32, 1], JOS: [9.64, 8.87, 1], ABB: [6.2, 6.67, 1], QRW: [5.6, 5.82, 1],
  SKO: [12.92, 5.21, 1], MIU: [11.86, 13.08, 1], YOL: [9.26, 12.43, 1],
  // Africa
  ACC: [5.6, -0.17, 0], NBO: [-1.32, 36.93, 3], JNB: [-26.14, 28.25, 2], CPT: [-33.97, 18.6, 2], CAI: [30.12, 31.41, 2],
  ADD: [8.98, 38.8, 3], KGL: [-1.97, 30.14, 2], CMN: [33.37, -7.59, 1], DKR: [14.67, -17.07, 0], ABJ: [5.26, -3.93, 0],
  LFW: [6.17, 1.25, 0], COO: [6.36, 2.38, 1], LAD: [-8.86, 13.23, 1], DAR: [-6.88, 39.2, 3],
  // Europe
  LHR: [51.47, -0.45, 0], LGW: [51.15, -0.19, 0], MAN: [53.35, -2.27, 0], BHX: [52.45, -1.75, 0], CDG: [49.01, 2.55, 1],
  AMS: [52.31, 4.76, 1], FRA: [50.04, 8.56, 1], IST: [41.28, 28.75, 3], MAD: [40.47, -3.56, 1], FCO: [41.8, 12.25, 1],
  LCA: [34.88, 33.63, 2], LIS: [38.78, -9.14, 0], DUB: [53.42, -6.27, 0], ZRH: [47.46, 8.55, 1], BRU: [50.9, 4.48, 1],
  // Middle East & Asia
  DXB: [25.25, 55.36, 4], AUH: [24.43, 54.65, 4], DOH: [25.27, 51.61, 3], JED: [21.68, 39.16, 3], RUH: [24.96, 46.7, 3],
  DEL: [28.56, 77.1, 5.5], BOM: [19.09, 72.87, 5.5], CAN: [23.39, 113.3, 8], LHW: [36.52, 103.62, 8], LHE: [31.52, 74.4, 5],
  LGK: [6.33, 99.73, 8], CGY: [8.61, 124.46, 8], LAO: [18.18, 120.53, 8], SIN: [1.36, 103.99, 8], BKK: [13.69, 100.75, 7],
  LAE: [-6.57, 146.73, 10], SYD: [-33.94, 151.18, 10],
  // Americas
  JFK: [40.64, -73.78, -5], IAD: [38.95, -77.46, -5], ATL: [33.64, -84.43, -5], IAH: [29.99, -95.34, -6], LAS: [36.08, -115.15, -8],
  LAX: [33.94, -118.41, -8], ORD: [41.98, -87.9, -6], DFW: [32.9, -97.04, -6], YYZ: [43.68, -79.63, -5], YUL: [45.47, -73.74, -5],
  YYC: [51.13, -114.01, -7],
};

const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in km. */
export function distanceKm(a: string, b: string) {
  const ga = airportGeo[a];
  const gb = airportGeo[b];
  if (!ga || !gb) return 3000;
  const dLat = rad(gb[0] - ga[0]);
  const dLon = rad(gb[1] - ga[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(ga[0])) * Math.cos(rad(gb[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Block time in minutes for a direct sector, rounded to 5. */
export function blockMinutes(a: string, b: string) {
  const min = 35 + (distanceKm(a, b) / 830) * 60;
  return Math.round(min / 5) * 5;
}

export const utcOffset = (code: string) => airportGeo[code]?.[2] ?? 0;
