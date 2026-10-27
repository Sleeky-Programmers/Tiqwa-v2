// MOCK airport data. Served through /api/airports until a real search API is connected.

export type Airport = { code: string; city: string; name: string; country: string };

export const airports: Airport[] = [
  // Nigeria
  { code: "LOS", city: "Lagos", name: "Murtala Muhammed International Airport", country: "Nigeria" },
  { code: "ABV", city: "Abuja", name: "Nnamdi Azikiwe International Airport", country: "Nigeria" },
  { code: "PHC", city: "Port Harcourt", name: "Port Harcourt International Airport", country: "Nigeria" },
  { code: "KAN", city: "Kano", name: "Mallam Aminu Kano International Airport", country: "Nigeria" },
  { code: "ENU", city: "Enugu", name: "Akanu Ibiam International Airport", country: "Nigeria" },
  { code: "QOW", city: "Owerri", name: "Sam Mbakwe International Airport", country: "Nigeria" },
  { code: "CBQ", city: "Calabar", name: "Margaret Ekpo International Airport", country: "Nigeria" },
  { code: "QUO", city: "Uyo", name: "Akwa Ibom International Airport", country: "Nigeria" },
  { code: "BNI", city: "Benin City", name: "Benin Airport", country: "Nigeria" },
  { code: "IBA", city: "Ibadan", name: "Ibadan Airport", country: "Nigeria" },
  { code: "ILR", city: "Ilorin", name: "Ilorin International Airport", country: "Nigeria" },
  { code: "KAD", city: "Kaduna", name: "Kaduna International Airport", country: "Nigeria" },
  { code: "JOS", city: "Jos", name: "Yakubu Gowon Airport", country: "Nigeria" },
  { code: "ABB", city: "Asaba", name: "Asaba International Airport", country: "Nigeria" },
  { code: "QRW", city: "Warri", name: "Osubi Airport", country: "Nigeria" },
  { code: "SKO", city: "Sokoto", name: "Sadiq Abubakar III International Airport", country: "Nigeria" },
  { code: "MIU", city: "Maiduguri", name: "Maiduguri International Airport", country: "Nigeria" },
  { code: "YOL", city: "Yola", name: "Yola Airport", country: "Nigeria" },
  // Africa
  { code: "ACC", city: "Accra", name: "Kotoka International Airport", country: "Ghana" },
  { code: "NBO", city: "Nairobi", name: "Jomo Kenyatta International Airport", country: "Kenya" },
  { code: "JNB", city: "Johannesburg", name: "O. R. Tambo International Airport", country: "South Africa" },
  { code: "CPT", city: "Cape Town", name: "Cape Town International Airport", country: "South Africa" },
  { code: "CAI", city: "Cairo", name: "Cairo International Airport", country: "Egypt" },
  { code: "ADD", city: "Addis Ababa", name: "Bole International Airport", country: "Ethiopia" },
  { code: "KGL", city: "Kigali", name: "Kigali International Airport", country: "Rwanda" },
  { code: "CMN", city: "Casablanca", name: "Mohammed V International Airport", country: "Morocco" },
  { code: "DKR", city: "Dakar", name: "Blaise Diagne International Airport", country: "Senegal" },
  { code: "ABJ", city: "Abidjan", name: "Félix-Houphouët-Boigny International Airport", country: "Côte d'Ivoire" },
  { code: "LFW", city: "Lomé", name: "Gnassingbé Eyadéma International Airport", country: "Togo" },
  { code: "COO", city: "Cotonou", name: "Cadjehoun Airport", country: "Benin" },
  { code: "LAD", city: "Luanda", name: "Quatro de Fevereiro Airport", country: "Angola" },
  { code: "DAR", city: "Dar es Salaam", name: "Julius Nyerere International Airport", country: "Tanzania" },
  // Europe
  { code: "LHR", city: "London", name: "Heathrow Airport", country: "United Kingdom" },
  { code: "LGW", city: "London", name: "Gatwick Airport", country: "United Kingdom" },
  { code: "MAN", city: "Manchester", name: "Manchester Airport", country: "United Kingdom" },
  { code: "BHX", city: "Birmingham", name: "Birmingham Airport", country: "United Kingdom" },
  { code: "CDG", city: "Paris", name: "Charles de Gaulle Airport", country: "France" },
  { code: "AMS", city: "Amsterdam", name: "Schiphol Airport", country: "Netherlands" },
  { code: "FRA", city: "Frankfurt", name: "Frankfurt Airport", country: "Germany" },
  { code: "IST", city: "Istanbul", name: "Istanbul Airport", country: "Türkiye" },
  { code: "MAD", city: "Madrid", name: "Adolfo Suárez Madrid–Barajas Airport", country: "Spain" },
  { code: "FCO", city: "Rome", name: "Leonardo da Vinci–Fiumicino Airport", country: "Italy" },
  { code: "LCA", city: "Larnaca", name: "Larnaca International Airport", country: "Cyprus" },
  { code: "LIS", city: "Lisbon", name: "Humberto Delgado Airport", country: "Portugal" },
  { code: "DUB", city: "Dublin", name: "Dublin Airport", country: "Ireland" },
  { code: "ZRH", city: "Zurich", name: "Zurich Airport", country: "Switzerland" },
  { code: "BRU", city: "Brussels", name: "Brussels Airport", country: "Belgium" },
  // Middle East & Asia
  { code: "DXB", city: "Dubai", name: "Dubai International Airport", country: "United Arab Emirates" },
  { code: "AUH", city: "Abu Dhabi", name: "Zayed International Airport", country: "United Arab Emirates" },
  { code: "DOH", city: "Doha", name: "Hamad International Airport", country: "Qatar" },
  { code: "JED", city: "Jeddah", name: "King Abdulaziz International Airport", country: "Saudi Arabia" },
  { code: "RUH", city: "Riyadh", name: "King Khalid International Airport", country: "Saudi Arabia" },
  { code: "DEL", city: "New Delhi", name: "Indira Gandhi International Airport", country: "India" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj International Airport", country: "India" },
  { code: "CAN", city: "Guangzhou", name: "Baiyun International Airport", country: "China" },
  { code: "LHW", city: "Lanzhou", name: "Lanzhou Zhongchuan International Airport", country: "China" },
  { code: "LHE", city: "Lahore", name: "Allama Iqbal International Airport", country: "Pakistan" },
  { code: "LGK", city: "Langkawi", name: "Langkawi International Airport", country: "Malaysia" },
  { code: "CGY", city: "Laguindingan", name: "Laguindingan Airport", country: "Philippines" },
  { code: "LAO", city: "Laoag City", name: "Laoag International Airport", country: "Philippines" },
  { code: "SIN", city: "Singapore", name: "Changi Airport", country: "Singapore" },
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi Airport", country: "Thailand" },
  { code: "LAE", city: "Lae", name: "Lae Nadzab Airport", country: "Papua New Guinea" },
  { code: "SYD", city: "Sydney", name: "Kingsford Smith Airport", country: "Australia" },
  // Americas
  { code: "JFK", city: "New York", name: "John F. Kennedy International Airport", country: "United States" },
  { code: "IAD", city: "Washington", name: "Dulles International Airport", country: "United States" },
  { code: "ATL", city: "Atlanta", name: "Hartsfield-Jackson Airport", country: "United States" },
  { code: "IAH", city: "Houston", name: "George Bush Intercontinental Airport", country: "United States" },
  { code: "LAS", city: "Las Vegas", name: "Harry Reid International Airport", country: "United States" },
  { code: "LAX", city: "Los Angeles", name: "Los Angeles International Airport", country: "United States" },
  { code: "ORD", city: "Chicago", name: "O'Hare International Airport", country: "United States" },
  { code: "DFW", city: "Dallas", name: "Dallas/Fort Worth International Airport", country: "United States" },
  { code: "YYZ", city: "Toronto", name: "Pearson International Airport", country: "Canada" },
  { code: "YUL", city: "Montreal", name: "Montréal–Trudeau International Airport", country: "Canada" },
  { code: "YYC", city: "Calgary", name: "Calgary International Airport", country: "Canada" },
];

/** Shown when the box is opened before the user has typed 2 letters. */
export const popularAirportCodes = ["LOS", "ABV", "LHR", "JFK", "CDG", "DXB", "YYZ", "SYD"];

export const getAirport = (code: string) => airports.find((a) => a.code === code);

/** Rank: Nigerian city-prefix matches first, then city prefix, code, name/country contains. */
export const searchAirports = (q: string, limit = 25): Airport[] => {
  const s = q.trim().toLowerCase();
  if (s.length < 2) return popularAirportCodes.map((c) => getAirport(c)!).filter(Boolean);
  const score = (a: Airport) => {
    const city = a.city.toLowerCase();
    if (city.startsWith(s)) return a.country === "Nigeria" ? 0 : 1;
    if (a.code.toLowerCase().startsWith(s)) return 2;
    if (city.includes(s) || a.name.toLowerCase().includes(s)) return 3;
    if (a.country.toLowerCase().startsWith(s)) return 4;
    return -1;
  };
  return airports
    .map((a) => ({ a, s: score(a) }))
    .filter((x) => x.s >= 0)
    .sort((x, y) => x.s - y.s)
    .slice(0, limit)
    .map((x) => x.a);
};
