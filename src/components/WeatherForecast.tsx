import { useEffect, useState } from "react";
import { fetchWeatherForecast, weatherCodeToLabel } from "../api/weather";
import type { WeatherForecast as WeatherForecastType } from "../api/weather";

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export function WeatherForecast() {
  const [weather, setWeather] = useState<WeatherForecastType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchWeatherForecast(5)
      .then((data) => {
        if (!cancelled) setWeather(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro ao carregar");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading && !weather) {
    return (
      <section className="section weather">
        <h2>Previsão do tempo</h2>
        <p className="weather-loading">Carregando previsão...</p>
      </section>
    );
  }

  if (error && !weather) {
    return (
      <section className="section weather">
        <h2>Previsão do tempo</h2>
        <p className="weather-error">{error}</p>
      </section>
    );
  }

  if (!weather) return null;

  return (
    <section className="section weather">
      <h2>Previsão do tempo</h2>
      <p className="weather-location">{weather.location} — próximos 5 dias</p>
      <div className="weather-grid">
        {weather.daily.map((day) => (
          <div key={day.date} className="weather-day">
            <span className="weather-day-name">{formatDay(day.date)}</span>
            <span className="weather-day-desc">{weatherCodeToLabel(day.weatherCode)}</span>
            <span className="weather-day-temps">
              {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
            </span>
            {day.precipitation > 0 && (
              <span className="weather-day-precip">Chuva: {day.precipitation} mm</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
