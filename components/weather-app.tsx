"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'
import { Droplets, Sun, Wind, Search, Mic, Moon, Thermometer, CloudRain, Umbrella, Compass, Maximize2, Minimize2, HelpCircle, MapPin, BarChart as BarChartIcon, Settings, Cloud, CloudSun, CloudMoon, Snowflake, CloudLightning, CloudDrizzle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next';
import '../i18n'; // Import the i18n configuration
import Image from 'next/image'; // Add this import

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'ur', name: 'Urdu' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' },
]

const getAQIColor = (aqi: number) => {
  if (aqi <= 50) return "bg-green-500 dark:bg-green-700"
  if (aqi <= 100) return "bg-yellow-500 dark:bg-yellow-700"
  if (aqi <= 150) return "bg-orange-500 dark:bg-orange-700"
  if (aqi <= 200) return "bg-red-500 dark:bg-red-700"
  if (aqi <= 300) return "bg-purple-500 dark:bg-purple-700"
  return "bg-rose-900 dark:bg-rose-950"
}

const getAQILabel = (aqi: number) => {
  if (aqi <= 50) return "Good"
  if (aqi <= 100) return "Moderate"
  if (aqi <= 150) return "Unhealthy for Sensitive Groups"
  if (aqi <= 200) return "Unhealthy"
  if (aqi <= 300) return "Very Unhealthy"
  return "Hazardous"
}

// Add this type definition for OpenWeatherMap API responses
type OpenWeatherMapWeatherResponse = {
  main: { temp: number; feels_like: number; humidity: number; pressure: number };
  wind: { speed: number };
  weather: Array<{ description: string }>;
  rain?: { '1h': number };
};

type OpenWeatherMapForecastResponse = {
  list: Array<{
    dt: number;
    main: { temp: number };
    pop: number;
  }>;
};

// Add this type definition at the top of the file, after the other type definitions
type WeatherData = {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    windSpeed: number;
    description: string;
    precipitation: number;
    pressure: number;
    uv_index: number;
  };
  forecast: Array<{ day: string; temp: number; precipitation: number }>;
  aqi: {
    aqi: number;
    pm10: number;
    pm25: number;
    o3: number;
    no2: number;
    so2: number;
    co: number;
  } | null;
  airQualityHistory: Array<{
    date: string;
    pm10: number;
    pm2_5: number;
    o3: number;
    no2: number;
    so2: number;
  }>;
  hourlyForecast: Array<{ time: string; temp: number; precipitation: number }>;
};

// Add this near the top of the file
const OPENWEATHERMAP_API_KEY = "9521977450572951a59964c05f914d23";
const AQICN_API_KEY = "d0b090140c194757591d63281c018c91e5ee8298"; // Replace with your actual AQICN API key

// Add a new type for AQICN API response
type AQICNResponse = {
  status: string;
  data: {
    aqi: number;
    iaqi: {
      pm10: { v: number };
      pm25: { v: number };
      o3: { v: number };
      no2: { v: number };
      so2: { v: number };
      co: { v: number };
      uvi?: { v: number }; // Add UVI to the type
    };
  };
};

type Suggestion = {
  name: string;
  country: string;
  countryCode: string; // Add this field
};

// Add this type definition near the top of the file
type GeocodingResult = {
  name: string;
  country: string;
  // Add other properties if needed
};

export function WeatherApp() {
  const { t, i18n } = useTranslation();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [inputValue, setInputValue] = useState('');
  const [isAutoSearch, setIsAutoSearch] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const fetchWeatherData = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const [weatherResponse, forecastResponse] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`)
      ]);

      const [weatherData, forecastData]: [OpenWeatherMapWeatherResponse, OpenWeatherMapForecastResponse] = await Promise.all([
        weatherResponse.json(),
        forecastResponse.json()
      ]);

      const aqiData = await fetchAQIData(lat, lon);

      setWeatherData({
        current: {
          temp: weatherData.main.temp,
          feels_like: weatherData.main.feels_like,
          humidity: weatherData.main.humidity,
          windSpeed: weatherData.wind.speed,
          description: weatherData.weather[0].description,
          precipitation: weatherData.rain?.['1h'] || 0,
          pressure: weatherData.main.pressure,
          uv_index: aqiData?.uvi || 0 // Use the UVI from AQICN API
        },
        forecast: forecastData.list.filter((item, index) => index % 8 === 0).slice(0, 7).map((day) => ({
          day: new Date(day.dt * 1000).toLocaleDateString('en', { weekday: 'short' }),
          temp: day.main.temp,
          precipitation: day.pop * 100 // Convert probability to percentage
        })),
        aqi: aqiData,
        airQualityHistory: [], // Not available in OpenWeatherMap API
        hourlyForecast: forecastData.list.slice(0, 24).map((hour) => ({
          time: new Date(hour.dt * 1000).toLocaleTimeString('en', { hour: '2-digit', hour12: false }),
          temp: hour.main.temp,
          precipitation: hour.pop * 100 // Convert probability to percentage
        }))
      });
    } catch (err) {
      setError('Failed to fetch weather data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAQIData = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${AQICN_API_KEY}`);
      const data: AQICNResponse = await response.json();
      if (data.status === "ok") {
        return {
          aqi: data.data.aqi,
          pm10: data.data.iaqi.pm10?.v || 0,
          pm25: data.data.iaqi.pm25?.v || 0,
          o3: data.data.iaqi.o3?.v || 0,
          no2: data.data.iaqi.no2?.v || 0,
          so2: data.data.iaqi.so2?.v || 0,
          co: data.data.iaqi.co?.v || 0,
          uvi: data.data.iaqi.uvi?.v || 0, // Add UVI to the returned object
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch AQI data:", error);
      return null;
    }
  };

  const handleSearch = async () => {
    if (inputValue.trim() === '') return;

    setLoading(true);
    setError(null);

    try {
      const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(inputValue)}&limit=5&appid=${OPENWEATHERMAP_API_KEY}`);
      const geoData = await geoResponse.json();
      console.log('Geocoding API response:', geoData);
      if (geoData && geoData.length > 0) {
        const exactMatch = geoData.find((location: { name: string; country: string }) => 
          location.name.toLowerCase() === inputValue.toLowerCase() ||
          `${location.name}, ${location.country}`.toLowerCase() === inputValue.toLowerCase()
        );
        const locationToUse = exactMatch || geoData[0];
        const { lat, lon, name, country } = locationToUse;
        await fetchWeatherData(lat, lon);
        const fullLocationName = `${name}, ${country}`;
        if (isAutoSearch) {
          setInputValue(fullLocationName); // Only update input if it's an auto search
        }
        setExpanded(true);
      } else {
        setError('Location not found');
      }
    } catch (err) {
      setError('Failed to search location');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSearch = () => {
    // Implement voice search functionality here
    console.log('Voice search initiated')
  }

  const handleLocationSearch = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      setIsAutoSearch(true); // Set this to true for automatic searches
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await fetchWeatherData(latitude, longitude);
            const locationName = await fetchLocationName(latitude, longitude);
            setInputValue(locationName); // Update the input value
            setExpanded(true);
          } catch (err) {
            setError('Failed to fetch weather data for your location');
            console.error(err);
          } finally {
            setLoading(false);
            setIsAutoSearch(false); // Reset after search is complete
          }
        },
        (error) => {
          setError('Failed to get your location: ' + error.message);
          setLoading(false);
          setIsAutoSearch(false); // Reset on error
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const fetchLocationName = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHERMAP_API_KEY}`);
      const data = await response.json();
      if (data && data.length > 0) {
        return `${data[0].name}, ${data[0].country}`;
      }
      return 'Unknown Location';
    } catch (error) {
      console.error('Error fetching location name:', error);
      return 'Unknown Location';
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  const getWeatherIcon = (description: string) => {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('clear')) return <Sun className="w-24 h-24 text-yellow-300" />;
    if (lowerDesc.includes('cloud') && lowerDesc.includes('sun')) return <CloudSun className="w-24 h-24 text-yellow-300" />;
    if (lowerDesc.includes('cloud') && lowerDesc.includes('moon')) return <CloudMoon className="w-24 h-24 text-blue-300" />;
    if (lowerDesc.includes('cloud')) return <Cloud className="w-24 h-24 text-gray-300" />;
    if (lowerDesc.includes('rain')) return <CloudRain className="w-24 h-24 text-blue-300" />;
    if (lowerDesc.includes('snow')) return <Snowflake className="w-24 h-24 text-blue-200" />;
    if (lowerDesc.includes('thunder')) return <CloudLightning className="w-24 h-24 text-yellow-400" />;
    if (lowerDesc.includes('drizzle')) return <CloudDrizzle className="w-24 h-24 text-blue-300" />;
    return <Sun className="w-24 h-24 text-yellow-300" />; // default icon
  };

  const instructionSteps = [
    { title: t('enterLocation'), description: t('typeLocation'), icon: MapPin, color: "bg-blue-200 dark:bg-blue-800" },
    { title: t('search'), description: t('clickSearch'), icon: Search, color: "bg-green-200 dark:bg-green-800" },
    { title: t('viewResults'), description: t('exploreWeather'), icon: BarChartIcon, color: "bg-yellow-200 dark:bg-yellow-800" },
    { title: t('customize'), description: t('useLanguage'), icon: Settings, color: "bg-purple-200 dark:bg-purple-800" },
  ]

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsAutoSearch(false);
    setSelectedSuggestionIndex(-1); // Reset selected index

    if (value.length > 2) {
      try {
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(value)}&limit=5&appid=${OPENWEATHERMAP_API_KEY}`);
        const data = await response.json();
        setSuggestions(data.map((item: GeocodingResult) => ({
          name: item.name,
          country: item.country,
          countryCode: item.country.toLowerCase()
        })));
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0) {
        handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
      } else {
        handleSearch();
      }
    }
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    setInputValue(`${suggestion.name}, ${suggestion.country}`);
    setSuggestions([]);
    handleSearch();
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative font-sans">
      {/* Updated animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 animate-gradient-xy"></div>
      
      {/* Updated Weather particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <EnhancedWeatherParticles />
      </div>

      <div className="relative z-10 min-h-screen w-full flex flex-col items-center justify-start p-4 md:p-8 space-y-8">
        {/* Instructions Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-6xl"
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 shadow-xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center">
                <HelpCircle className="mr-2" /> {t('howToUse')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {instructionSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex flex-col h-full"
                  >
                    <Card className={`${step.color} text-gray-800 dark:text-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full`}>
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center">
                          <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center justify-center mr-3">
                            <step.icon className="w-6 h-6" />
                          </div>
                          {step.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p>{step.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weather App Card */}
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: expanded ? 1 : 0.8, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`w-full ${expanded ? 'max-w-6xl' : 'max-w-lg'}`}
          >
            <Card className={`bg-white dark:bg-gray-900 shadow-xl ${expanded ? 'w-full' : 'w-full mx-auto'}`}>
              <CardHeader className="flex flex-col space-y-4 border-b dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-bold">{t('weatherDashboard')}</CardTitle>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleExpanded}
                    className="ml-2 border-2 dark:border-white"
                  >
                    {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-full sm:w-[180px] border-2 dark:border-white">
                      <SelectValue placeholder={t('selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between sm:justify-start space-x-2">
                    <div className="flex items-center bg-gray-200 dark:bg-gray-700 p-1 rounded-full w-28 h-12 relative">
                      <Sun className="h-6 w-6 text-yellow-500 absolute left-3 z-10" />
                      <Moon className="h-6 w-6 text-blue-500 absolute right-3 z-10" />
                      <div
                        className={`w-10 h-10 rounded-full absolute top-1 transition-transform duration-300 ease-in-out ${
                          darkMode
                            ? 'bg-gray-800 bg-opacity-90 transform translate-x-16 shadow-inner-light'
                            : 'bg-white bg-opacity-90 transform translate-x-0 shadow-inner-dark'
                        }`}
                      ></div>
                      <Switch
                        checked={darkMode}
                        onCheckedChange={setDarkMode}
                        className="w-full h-full opacity-0 cursor-pointer z-20"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex space-x-2 mb-6 relative">
                  <Input
                    type="text"
                    placeholder={t('searchLocation')}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown} // Add this line
                    className="flex-grow border-2 dark:border-white"
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center ${
                            index === selectedSuggestionIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                          }`}
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          <Image
                            src={`https://flagcdn.com/24x18/${suggestion.countryCode}.png`}
                            alt={`${suggestion.country} flag`}
                            width={24}
                            height={18}
                            className="mr-2"
                          />
                          {`${suggestion.name}, ${suggestion.country}`}
                        </div>
                      ))}
                    </div>
                  )}
                  <Button onClick={handleSearch} className="border-2 dark:border-white">
                    <Search className="h-4 w-4 mr-2" />
                    {t('search')}
                  </Button>
                  <Button onClick={handleLocationSearch} className="border-2 dark:border-white">
                    <MapPin className="h-4 w-4 mr-2" />
                    {t('myLocation')}
                  </Button>
                  <Button onClick={handleVoiceSearch} variant="outline" className="border-2 dark:border-white">
                    <Mic className="h-4 w-4" />
                    <span className="sr-only">{t('voiceSearch')}</span>
                  </Button>
                </div>

                {loading && (
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-4">
                    <motion.div
                      className="h-full bg-blue-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                  </div>
                )}

                {error && <p className="text-red-500 mt-4">{error}</p>}

                {expanded && weatherData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    {/* Current Weather Card */}
                    <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      <CardHeader>
                        <CardTitle className="text-2xl font-bold">{t('currentWeather')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col md:flex-row justify-between items-center">
                          <div className="flex items-center mb-4 md:mb-0">
                            {getWeatherIcon(weatherData.current.description)}
                            <div className="ml-6">
                              <p className="text-6xl font-bold">{weatherData.current.temp}°C</p>
                              <p className="text-xl mt-2">{t('weatherDescription', { description: weatherData.current.description })}</p>
                              <div className="flex items-center mt-2">
                                <Thermometer className="w-5 h-5 mr-2" />
                                <p className="text-lg">{t('feelsLike')}: {weatherData.current.feels_like}°C</p>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-white/20 p-3 rounded-lg">
                              <Droplets className="w-8 h-8 mx-auto text-blue-200" />
                              <p className="mt-2 font-semibold">{t('humidity')}</p>
                              <p className="text-lg">{weatherData.current.humidity}%</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                              <Wind className="w-8 h-8 mx-auto text-blue-200" />
                              <p className="mt-2 font-semibold">{t('windSpeed')}</p>
                              <p className="text-lg">{weatherData.current.windSpeed} m/s</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                              <CloudRain className="w-8 h-8 mx-auto text-blue-200" />
                              <p className="mt-2 font-semibold">{t('precipitation')}</p>
                              <p className="text-lg">{weatherData.current.precipitation} mm</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                              <Thermometer className="w-8 h-8 mx-auto text-blue-200" />
                              <p className="mt-2 font-semibold">{t('pressure')}</p>
                              <p className="text-lg">{weatherData.current.pressure} hPa</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 flex justify-between items-center bg-white/10 p-4 rounded-lg">
                          <div className="flex items-center">
                            <Umbrella className="w-6 h-6 mr-2 text-yellow-300" />
                            <span>{t('uvIndex')}: {weatherData.current.uv_index}</span>
                          </div>
                          <div className="flex items-center">
                            <Compass className="w-6 h-6 mr-2 text-yellow-300" />
                            <span>{t('windDirection')}: N/A</span>
                          </div>
                          <div className="flex items-center">
                            <Thermometer className="w-6 h-6 mr-2 text-yellow-300" />
                            <span>{t('feelsLike')}: {weatherData.current.feels_like}°C</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Other weather cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 h-full">
                          <CardHeader className="border-b dark:border-gray-700">
                            <CardTitle>{t('hourlyForecast')}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={weatherData.hourlyForecast}>
                                <XAxis 
                                  dataKey="time" 
                                  stroke={darkMode ? "#fff" : "#000"}
                                  interval={2}
                                  tickFormatter={(time) => time.split(':')[0]}
                                />
                                <YAxis yAxisId="left" stroke={darkMode ? "#fff" : "#000"} />
                                <YAxis yAxisId="right" orientation="right" stroke={darkMode ? "#fff" : "#000"} />
                                <Tooltip contentStyle={{ backgroundColor: darkMode ? "#1f2937" : "#fff", color: darkMode ? "#fff" : "#000" }} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="temp" name={t('temperature') + " (°C)"} stroke="#8884d8" strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="precipitation" name={t('precipitation') + " (%)"} stroke="#82ca9d" strokeWidth={2} />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="lg:col-span-1">
                        {weatherData.aqi && (
                          <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
                            <CardHeader className="border-b dark:border-gray-700">
                              <CardTitle>{t('airQualityIndex')}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                              <div className="flex flex-col items-center">
                                <div className={`w-32 h-32 rounded-full flex items-center justify-center ${getAQIColor(weatherData.aqi.aqi)}`}>
                                  <span className="text-3xl font-bold text-white">{weatherData.aqi.aqi}</span>
                                </div>
                                <Badge className="mt-4 mb-6" variant="secondary">{getAQILabel(weatherData.aqi.aqi)}</Badge>
                                <div className="w-full h-48">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={[
                                          { name: 'PM10', value: weatherData.aqi.pm10 },
                                          { name: 'PM2.5', value: weatherData.aqi.pm25 },
                                          { name: 'O3', value: weatherData.aqi.o3 },
                                          { name: 'NO2', value: weatherData.aqi.no2 },
                                          { name: 'SO2', value: weatherData.aqi.so2 },
                                          { name: 'CO', value: weatherData.aqi.co },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                      >
                                        {[
                                          { name: 'PM10', value: weatherData.aqi.pm10 },
                                          { name: 'PM2.5', value: weatherData.aqi.pm25 },
                                          { name: 'O3', value: weatherData.aqi.o3 },
                                          { name: 'NO2', value: weatherData.aqi.no2 },
                                          { name: 'SO2', value: weatherData.aqi.so2 },
                                          { name: 'CO', value: weatherData.aqi.co },
                                        ].map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9884d8', '#82ca9d'][index % 6]} />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        contentStyle={{ backgroundColor: darkMode ? "#1f2937" : "#fff", color: darkMode ? "#fff" : "#000" }}
                                        formatter={(value: number) => [`${value} µg/m³`, undefined]}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                                <div className="flex flex-wrap justify-around w-full mt-4">
                                  {[
                                    { name: 'PM10', value: weatherData.aqi.pm10 },
                                    { name: 'PM2.5', value: weatherData.aqi.pm25 },
                                    { name: 'O3', value: weatherData.aqi.o3 },
                                    { name: 'NO2', value: weatherData.aqi.no2 },
                                    { name: 'SO2', value: weatherData.aqi.so2 },
                                    { name: 'CO', value: weatherData.aqi.co },
                                  ].map((entry, index) => (
                                    <div key={entry.name} className="flex items-center m-2">
                                      <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9884d8', '#82ca9d'][index % 6] }}></div>
                                      <span>{entry.name}: {entry.value} µg/m³</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 col-span-1 lg:col-span-3">
                        <CardHeader className="border-b dark:border-gray-700">
                          <CardTitle>{t('sevenDayForecast')}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={weatherData.forecast}>
                                <XAxis dataKey="day" stroke={darkMode ? "#fff" : "#000"} />
                                <YAxis yAxisId="left" stroke={darkMode ? "#fff" : "#000"} />
                                <YAxis yAxisId="right" orientation="right" stroke={darkMode ? "#fff" : "#000"} />
                                <Tooltip contentStyle={{ backgroundColor: darkMode ? "#1f2937" : "#fff", color: darkMode ? "#fff" : "#000" }} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="temp" name={t('temperature') + " (°C)"} fill="#8884d8" />
                                <Bar yAxisId="right" dataKey="precipitation" name={t('precipitation') + " (mm)"} fill="#82ca9d" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function EnhancedWeatherParticles() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="absolute inset-0">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white opacity-30"
          initial={{
            x: Math.random() * windowSize.width,
            y: Math.random() * windowSize.height,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            x: Math.random() * windowSize.width,
            y: Math.random() * windowSize.height,
            scale: Math.random() * 0.5 + 0.5,
          }}
          transition={{
            duration: Math.random() * 10 + 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{
            width: `${Math.random() * 10 + 5}px`,
            height: `${Math.random() * 10 + 5}px`,
          }}
        />
      ))}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`cloud-${i}`}
          className="absolute bg-white opacity-20"
          initial={{
            x: -200,
            y: Math.random() * windowSize.height,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            x: windowSize.width + 200,
            y: Math.random() * windowSize.height,
          }}
          transition={{
            duration: Math.random() * 60 + 60,
            repeat: Infinity,
            repeatType: "loop",
          }}
          style={{
            width: `${Math.random() * 200 + 100}px`,
            height: `${Math.random() * 60 + 40}px`,
            borderRadius: '50%',
            filter: 'blur(10px)',
          }}
        />
      ))}
    </div>
  );
}