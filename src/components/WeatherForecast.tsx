import { useEffect, useState, useCallback } from "react";
import {
  fetchWeatherForecast,
  searchCities,
  weatherCodeToLabel,
} from "../api/weather";
import type {
  WeatherForecast as WeatherForecastType,
  GeoResult,
} from "../api/weather";

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatHour(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSunshineDuration(seconds: number): string {
  const hours = Math.round(seconds / 3600);
  const min = Math.round((seconds % 3600) / 60);
  if (hours >= 1) return `${hours} h${min > 0 ? ` ${min} min` : ""}`;
  return `${Math.round(seconds / 60)} min`;
}

function formatSunTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WeatherForecast() {
  const [weather, setWeather] = useState<WeatherForecastType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    lat: number;
    lon: number;
    timezone: string;
  } | null>(null);

  const loadForecast = useCallback(
    (lat?: number, lon?: number, timezone?: string, locationName?: string) => {
      setError(null);
      setLoading(true);
      fetchWeatherForecast(
        lat ?? -20.3,
        lon ?? -40.3,
        timezone ?? "America/Sao_Paulo",
        locationName ?? "Vitória, ES",
        5
      )
        .then((data) => setWeather(data))
        .catch((e) =>
          setError(e instanceof Error ? e.message : "Erro ao carregar")
        )
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => {
    loadForecast(
      selectedLocation?.lat,
      selectedLocation?.lon,
      selectedLocation?.timezone,
      selectedLocation?.name
    );
  }, [selectedLocation, loadForecast]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      setSearching(true);
      searchCities(searchQuery)
        .then((results) => setSearchResults(results))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSelectCity = (city: GeoResult) => {
    setSelectedLocation({
      name: [city.name, city.admin1, city.country_code]
        .filter(Boolean)
        .join(", "),
      lat: city.latitude,
      lon: city.longitude,
      timezone: city.timezone,
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  if (loading && !weather) {
    return (
      <section className="section weather">
        <h2>Previsão do tempo</h2>
        <p className="weather-loading">Carregando previsão...</p>
      </section>
    );
  }

  return (
    <section className="section weather">
      <h2>Previsão do tempo</h2>

      <div className="weather-search">
        <label htmlFor="weather-city" className="weather-search-label">
          Pesquisar cidade
        </label>
        <input
          id="weather-city"
          type="text"
          className="weather-search-input"
          placeholder="Ex: Vitória, São Paulo, Belo Horizonte..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
        />
        {searching && <span className="weather-search-status">Buscando...</span>}
        {searchResults.length > 0 && (
          <ul className="weather-search-results">
            {searchResults.slice(0, 6).map((city) => (
              <li key={city.id}>
                <button
                  type="button"
                  className="weather-search-result-btn"
                  onClick={() => handleSelectCity(city)}
                >
                  {city.name}
                  {city.admin1 && `, ${city.admin1}`}
                  <span className="weather-search-result-cc">
                    {city.country_code}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && !weather && (
        <p className="weather-error">{error}</p>
      )}

      {weather && (
        <>
          <p className="weather-location">
            {weather.location} — próximos 5 dias
          </p>

          <div className="weather-grid">
            {weather.daily.map((day) => (
              <div key={day.date} className="weather-day">
                <span className="weather-day-name">{formatDay(day.date)}</span>
                <span className="weather-day-desc">
                  {weatherCodeToLabel(day.weatherCode)}
                </span>
                <span className="weather-day-temps">
                  {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
                </span>
                {day.precipitation > 0 && (
                  <span className="weather-day-precip">
                    Chuva: {day.precipitation} mm
                  </span>
                )}
                <span className="weather-day-extra">
                  UV máx.: {day.uvIndexMax.toFixed(1)}
                </span>
                <span className="weather-day-extra">
                  Sol: {formatSunshineDuration(day.sunshineDurationSeconds)}
                </span>
                <span className="weather-day-extra">
                  Nascer: {formatSunTime(day.sunrise)}
                </span>
                <span className="weather-day-extra">
                  Pôr do sol: {formatSunTime(day.sunset)}
                </span>
              </div>
            ))}
          </div>

          <h3 className="weather-detail-title">
            Detalhamento por hora (temperatura, chuva, radiação solar e UV)
          </h3>
          <p className="weather-detail-note">
            Próximas 24 horas — temp. (°C), chuva (mm), radiação (W/m²), índice UV
          </p>
          <div className="weather-hourly-wrap">
            <div className="weather-hourly">
              {weather.hourly.slice(0, 24).map((h) => (
                <div key={h.time} className="weather-hour">
                  <span className="weather-hour-time">{formatHour(h.time)}</span>
                  <span className="weather-hour-temp">{Math.round(h.temp)}°</span>
                  <span className="weather-hour-precip">
                    {h.precipitation > 0 ? `${h.precipitation} mm` : "—"}
                  </span>
                  <span className="weather-hour-solar" title="Radiação solar">
                    {h.shortwaveRadiation > 0 ? `${Math.round(h.shortwaveRadiation)} W/m²` : "—"}
                  </span>
                  <span className="weather-hour-uv" title="Índice UV">
                    UV {h.uvIndex > 0 ? h.uvIndex.toFixed(1) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
