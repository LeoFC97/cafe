/**
 * Open-Meteo: https://open-meteo.com/en/docs
 * Geocoding: https://geocoding-api.open-meteo.com/v1/search
 * Sem API key.
 */

export interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country_code: string;
  admin1?: string;
  timezone: string;
}

export interface WeatherForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weatherCode: number;
}

export interface WeatherForecastHour {
  time: string; // ISO
  temp: number;
  precipitation: number;
}

export interface WeatherForecast {
  location: string;
  timezone: string;
  daily: WeatherForecastDay[];
  hourly: WeatherForecastHour[];
}

const DEFAULT_LAT = -20.3;
const DEFAULT_LON = -40.3;
const DEFAULT_TIMEZONE = "America/Sao_Paulo";
const DEFAULT_LOCATION = "Vitória, ES";

export async function searchCities(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query.trim());
  url.searchParams.set("count", "10");
  url.searchParams.set("language", "pt");

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const json = (await res.json()) as { results?: GeoResult[] };
  return json.results ?? [];
}

export async function fetchWeatherForecast(
  lat: number = DEFAULT_LAT,
  lon: number = DEFAULT_LON,
  timezone: string = DEFAULT_TIMEZONE,
  locationName: string = DEFAULT_LOCATION,
  days = 5
): Promise<WeatherForecast> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("timezone", timezone);
  url.searchParams.set("forecast_days", String(days));
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code");
  url.searchParams.set("hourly", "temperature_2m,precipitation");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Falha ao buscar previsão do tempo");
  const json = (await res.json()) as {
    daily: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
      weather_code: number[];
    };
    hourly: {
      time: string[];
      temperature_2m: number[];
      precipitation: number[];
    };
  };

  const daily = json.daily.time.map((date, i) => ({
    date,
    tempMax: json.daily.temperature_2m_max[i],
    tempMin: json.daily.temperature_2m_min[i],
    precipitation: json.daily.precipitation_sum[i],
    weatherCode: json.daily.weather_code[i],
  }));

  const hourly = json.hourly.time.map((time, i) => ({
    time,
    temp: json.hourly.temperature_2m[i],
    precipitation: json.hourly.precipitation[i],
  }));

  return { location: locationName, timezone, daily, hourly };
}

const WEATHER_LABELS: Record<number, string> = {
  0: "Céu limpo",
  1: "Principalmente limpo",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Neblina",
  48: "Neblina",
  51: "Garoa",
  53: "Garoa",
  55: "Garoa",
  61: "Chuva leve",
  63: "Chuva",
  65: "Chuva forte",
  80: "Pancadas de chuva",
  81: "Pancadas de chuva",
  82: "Pancadas fortes",
  95: "Temporal",
  96: "Temporal com granizo",
  99: "Temporal forte com granizo",
};

export function weatherCodeToLabel(code: number): string {
  return WEATHER_LABELS[code] ?? "Variável";
}
