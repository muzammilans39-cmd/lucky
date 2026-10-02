import React, { useState, useEffect } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Volume2,
  RefreshCw,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { WeatherData, fetchWeatherForecast } from '../utils/weatherService';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';

export const WeatherCard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detectedCity, setDetectedCity] = useState('Local Area');

  const loadWeather = async (lat?: number, lon?: number, cityName = 'Local Area') => {
    setLoading(true);
    try {
      const data = await fetchWeatherForecast(lat, lon, cityName);
      setWeather(data);
    } catch {
      // Handled in service
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Attempt device geolocation with fallback
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          loadWeather(pos.coords.latitude, pos.coords.longitude, 'Your Location');
          setDetectedCity('Your Location');
        },
        () => {
          // Default latitude / longitude
          loadWeather(37.7749, -122.4194, 'Local Forecast');
        },
        { timeout: 6000 }
      );
    } else {
      loadWeather();
    }
  }, []);

  const handleSpeakWeather = () => {
    sound.playTap();
    if (!weather) return;
    const speechText = `Today's weather forecast for ${weather.locationName}: It is currently ${weather.currentTemp} degrees. ${weather.summarySentence} ${weather.seniorAdvice}`;
    speech.speakText(speechText);
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-10 h-10 text-amber-400 stroke-[2.5]" />;
    if (code <= 2) return <CloudSun className="w-10 h-10 text-amber-300 stroke-[2.5]" />;
    if (code === 3) return <Cloud className="w-10 h-10 text-slate-300 stroke-[2.5]" />;
    if (code >= 51 && code <= 82) return <CloudRain className="w-10 h-10 text-sky-400 stroke-[2.5]" />;
    if (code >= 71 && code <= 75) return <CloudSnow className="w-10 h-10 text-indigo-300 stroke-[2.5]" />;
    if (code >= 95) return <CloudLightning className="w-10 h-10 text-yellow-400 stroke-[2.5]" />;
    return <Sun className="w-10 h-10 text-amber-400 stroke-[2.5]" />;
  };

  if (loading && !weather) {
    return (
      <div className="bg-slate-800/80 border-2 border-slate-700 rounded-3xl p-5 shadow-lg flex items-center justify-center gap-3 text-slate-300 py-6">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
        <span className="text-lg font-bold">Checking today's weather forecast...</span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="bg-gradient-to-r from-sky-950/70 via-slate-900 to-slate-900 border-3 border-sky-400/80 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Weather Condition & Temperature */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border-2 border-sky-400/50 shadow-md flex-shrink-0">
            {getWeatherIcon(weather.weatherCode)}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase bg-sky-950 text-sky-300 border border-sky-500/50 px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {weather.locationName}
              </span>
              <span className="text-xs text-slate-400 font-bold">Today's Forecast</span>
            </div>

            {/* Condition sentence e.g. "Sunny with a high of 75" */}
            <h3 className="text-2xl md:text-3xl font-black text-white mt-1">
              {weather.summarySentence}
            </h3>

            {/* High / Low & Current Temp Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mt-1 text-base md:text-lg">
              <span className="text-amber-300 font-black">
                Currently: {weather.currentTemp}°F
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-bold">
                High: {weather.high}°F
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-sky-300 font-bold">
                Low: {weather.low}°F
              </span>
            </div>

            {/* Senior Activity / Clothing Advice */}
            <p className="text-slate-300 text-sm md:text-base mt-1.5 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{weather.seniorAdvice}</span>
            </p>
          </div>
        </div>

        {/* Right: Read Weather Aloud & Refresh buttons */}
        <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
          <button
            onClick={handleSpeakWeather}
            className="flex items-center gap-2 px-4 py-3 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black rounded-2xl shadow-lg border-2 border-amber-300 text-base transition-transform active:scale-95"
            aria-label={`Read weather aloud: ${weather.summarySentence}`}
            title="Read weather forecast aloud"
          >
            <Volume2 className="w-6 h-6 stroke-[2.5]" />
            <span>Read Weather</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              loadWeather();
            }}
            className="p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white rounded-2xl border border-slate-700 shadow-sm"
            aria-label="Refresh weather forecast"
            title="Refresh forecast"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
