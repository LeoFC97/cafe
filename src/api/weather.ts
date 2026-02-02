/**
 * Open-Meteo: https://open-meteo.com/en/docs
 * Sem API key. Região padrão: Vitória/ES (área cafeeira).
 */
const DEFAULT_LAT = -20.3;
const DEFAULT_LON = -40.3;
const TIMEZONE = "America/Sao_Paulo";

export interface WeatherForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weatherCode: number;
}

export interface WeatherForecast {
  location: string;
  daily: WeatherForecastDay[];
}

export async function fetchWeatherForecast(days = 5): Promise<WeatherForecast> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(DEFAULT_LAT));
  url.searchParams.set("longitude", String(DEFAULT_LON));
  url.searchParams.set("timezone", TIMEZONE);
  url.searchParams.set("forecast_days", String(days));
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code");

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
  };

  const daily = json.daily.time.map((date, i) => ({
    date,
    tempMax: json.daily.temperature_2m_max[i],
    tempMin: json.daily.temperature_2m_min[i],
    precipitation: json.daily.precipitation_sum[i],
    weatherCode: json.daily.weather_code[i],
  }));

  return { location: "Vitória / região ES", daily };
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
