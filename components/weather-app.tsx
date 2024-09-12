"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'
import { Droplets, Sun, Wind, Search, Mic, Moon, Thermometer, CloudRain, Umbrella, Compass, Maximize2, Minimize2, HelpCircle, MapPin, BarChart as BarChartIcon, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

// ... existing imports ...

// Add this type definition
type WeatherData = {
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    description: string;
    precipitation: number;
    pressure: number;
    uv_index: number;
  };
  forecast: Array<{ day: string; temp: number; precipitation: number }>;
  aqi: number;
  airQualityHistory: Array<{ date: string; pm10: number; pm2_5: number; o3: number; no2: number; so2: number }>;
  hourlyForecast: Array<{ time: string; temp: number; precipitation: number }>;
};

export function WeatherApp() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState('en')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation,pressure_msl,uv_index&hourly=temperature_2m,precipitation_probability,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`)
      const weatherData = await weatherResponse.json()

      const airQualityResponse = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,ozone,nitrogen_dioxide,sulphur_dioxide&hourly=pm10,pm2_5,ozone,nitrogen_dioxide,sulphur_dioxide&timezone=auto`)
      const airQualityData = await airQualityResponse.json()

      setWeatherData({
        current: {
          temp: weatherData.current.temperature_2m,
          humidity: weatherData.current.relative_humidity_2m,
          windSpeed: weatherData.current.wind_speed_10m,
          description: getWeatherDescription(weatherData.current.weather_code),
          precipitation: weatherData.current.precipitation,
          pressure: weatherData.current.pressure_msl,
          uv_index: weatherData.current.uv_index
        },
        forecast: weatherData.daily.time.map((day: string, index: number) => ({
          day: new Date(day).toLocaleDateString('en', { weekday: 'short' }),
          temp: (weatherData.daily.temperature_2m_max[index] + weatherData.daily.temperature_2m_min[index]) / 2,
          precipitation: weatherData.daily.precipitation_sum[index]
        })),
        aqi: airQualityData.current.european_aqi,
        airQualityHistory: airQualityData.hourly.time.slice(0, 24).map((time: string, index: number) => ({
          date: new Date(time).toLocaleTimeString('en', { hour: '2-digit', hour12: false }),
          pm10: airQualityData.hourly.pm10[index],
          pm2_5: airQualityData.hourly.pm2_5[index],
          o3: airQualityData.hourly.ozone[index],
          no2: airQualityData.hourly.nitrogen_dioxide[index],
          so2: airQualityData.hourly.sulphur_dioxide[index]
        })),
        hourlyForecast: weatherData.hourly.time.slice(0, 24).map((time: string, index: number) => ({
          time: new Date(time).toLocaleTimeString('en', { hour: '2-digit', hour12: false }),
          temp: weatherData.hourly.temperature_2m[index],
          precipitation: weatherData.hourly.precipitation_probability[index]
        }))
      })
    } catch (err) {
      setError('Failed to fetch weather data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    try {
      const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=${language}&format=json`)
      const geoData = await geoResponse.json()
      if (geoData.results && geoData.results.length > 0) {
        const { latitude, longitude } = geoData.results[0]
        await fetchWeatherData(latitude, longitude)
        setExpanded(true)
      } else {
        setError('Location not found')
      }
    } catch (err) {
      setError('Failed to search location')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceSearch = () => {
    // Implement voice search functionality here
    console.log('Voice search initiated')
  }

  const getWeatherDescription = (code: number) => {
    // Implement a more comprehensive weather code to description mapping
    const weatherCodes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail',
    }
    return weatherCodes[code as keyof typeof weatherCodes] || 'Unknown'
  }

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  const instructionSteps = [
    { title: "Enter Location", description: "Type a city or location in the search box.", icon: MapPin, color: "bg-blue-200 dark:bg-blue-800" },
    { title: "Search", description: "Click the search button or press Enter to find weather data.", icon: Search, color: "bg-green-200 dark:bg-green-800" },
    { title: "View Results", description: "Explore detailed weather information and forecasts.", icon: BarChartIcon, color: "bg-yellow-200 dark:bg-yellow-800" },
    { title: "Customize", description: "Use language and theme toggles to personalize your experience.", icon: Settings, color: "bg-purple-200 dark:bg-purple-800" },
  ]

  const renderAQICard = (weatherData: WeatherData) => {
    const aqiData = [
      { name: 'PM10', value: weatherData.airQualityHistory[0].pm10 },
      { name: 'PM2.5', value: weatherData.airQualityHistory[0].pm2_5 },
    ]
    const COLORS = ['#0088FE', '#00C49F']

    return (
      <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
        <CardHeader className="border-b dark:border-gray-700">
          <CardTitle>Air Quality Index</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col items-center">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center ${getAQIColor(weatherData.aqi)}`}>
              <span className="text-3xl font-bold text-white">{weatherData.aqi}</span>
            </div>
            <Badge className="mt-4 mb-6" variant="secondary">{getAQILabel(weatherData.aqi)}</Badge>
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aqiData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {aqiData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: darkMode ? "#1f2937" : "#fff", color: darkMode ? "#fff" : "#000" }}
                    formatter={(value: number) => [`${value} µg/m³`, undefined]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around w-full mt-4">
              {aqiData.map((entry, index) => (
                <div key={entry.name} className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: COLORS[index] }}></div>
                  <span>{entry.name}: {entry.value} µg/m³</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 animate-gradient-xy"></div>
      
      {/* Weather particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <WeatherParticles />
      </div>

      <div className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center p-4">
        {/* Instructions Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-6xl mb-8"
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 shadow-xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center">
                <HelpCircle className="mr-2" /> How to Use
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
                  <CardTitle className="text-2xl font-bold">Weather Dashboard</CardTitle>
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
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full sm:w-[180px] border-2 dark:border-white">
                      <SelectValue placeholder="Select Language" />
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
                <div className="flex space-x-2 mb-6">
                  <Input
                    type="text"
                    placeholder="Search location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow border-2 dark:border-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} className="border-2 dark:border-white">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button onClick={handleVoiceSearch} variant="outline" className="border-2 dark:border-white">
                    <Mic className="h-4 w-4" />
                    <span className="sr-only">Voice Search</span>
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
                        <CardTitle className="text-2xl font-bold">Current Weather</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col md:flex-row justify-between items-center">
                          <div className="flex items-center mb-4 md:mb-0">
                            <Sun className="w-24 h-24 text-yellow-300 mr-6" />
                            <div>
                              <p className="text-6xl font-bold">{weatherData.current.temp}°C</p>
                              <p className="text-xl mt-2">{weatherData.current.description}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-white/20 p-3 rounded-lg">
                              <Droplets className="w-8 h-8 mx-auto text-blue-200" />
                              <p className="mt-2 font-semibold">Humidity</p>
                              <p className="text-lg">{weatherData.current.humidity}%</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                              <Wind className="w-8 h-8 mx-auto text-blue-200" />
                              <p className="mt-2 font-semibold">Wind Speed</p>
                              <p className="text-lg">{weatherData.current.windSpeed} m/s</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                              <CloudRain className="w-8 h-8 mx-auto text-blue-200" />
                              <p className="mt-2 font-semibold">Precipitation</p>
                              <p className="text-lg">{weatherData.current.precipitation} mm</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                              <Thermometer className="w-8 h-8 mx-auto text-blue-200" />
                              <p className="mt-2 font-semibold">Pressure</p>
                              <p className="text-lg">{weatherData.current.pressure} hPa</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 flex justify-between items-center bg-white/10 p-4 rounded-lg">
                          <div className="flex items-center">
                            <Umbrella className="w-6 h-6 mr-2 text-yellow-300" />
                            <span>UV Index: {weatherData.current.uv_index}</span>
                          </div>
                          <div className="flex items-center">
                            <Compass className="w-6 h-6 mr-2 text-yellow-300" />
                            <span>Wind Direction: N/A</span>
                          </div>
                          <div className="flex items-center">
                            <Sun className="w-6 h-6 mr-2 text-yellow-300" />
                            <span>Feels Like: N/A°C</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Other weather cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 h-full">
                          <CardHeader className="border-b dark:border-gray-700">
                            <CardTitle>Hourly Forecast</CardTitle>
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
                                <Line yAxisId="left" type="monotone" dataKey="temp" name="Temperature (°C)" stroke="#8884d8" strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="precipitation" name="Precipitation (%)" stroke="#82ca9d" strokeWidth={2} />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="lg:col-span-1">
                        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 h-full">
                          <CardHeader className="border-b dark:border-gray-700">
                            <CardTitle>Air Quality Index</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 flex flex-col h-[400px]">
                            <div className="flex flex-col items-center justify-between flex-grow">
                              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${getAQIColor(weatherData.aqi)}`}>
                                <span className="text-2xl font-bold text-white">{weatherData.aqi}</span>
                              </div>
                              <Badge className="my-2" variant="secondary">{getAQILabel(weatherData.aqi)}</Badge>
                              <div className="w-full h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={[
                                        { name: 'PM10', value: weatherData.airQualityHistory[0].pm10 },
                                        { name: 'PM2.5', value: weatherData.airQualityHistory[0].pm2_5 },
                                      ]}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={40}
                                      outerRadius={60}
                                      fill="#8884d8"
                                      paddingAngle={5}
                                      dataKey="value"
                                    >
                                      {[
                                        { name: 'PM10', value: weatherData.airQualityHistory[0].pm10 },
                                        { name: 'PM2.5', value: weatherData.airQualityHistory[0].pm2_5 },
                                      ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F'][index % 2]} />
                                      ))}
                                    </Pie>
                                    <Tooltip
                                      contentStyle={{ backgroundColor: darkMode ? "#1f2937" : "#fff", color: darkMode ? "#fff" : "#000" }}
                                      formatter={(value: number) => [`${value} µg/m³`, undefined]}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="flex justify-around w-full mt-2">
                                {[
                                  { name: 'PM10', value: weatherData.airQualityHistory[0].pm10 },
                                  { name: 'PM2.5', value: weatherData.airQualityHistory[0].pm2_5 },
                                ].map((entry, index) => (
                                  <div key={entry.name} className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: ['#0088FE', '#00C49F'][index] }}></div>
                                    <span className="text-sm">{entry.name}: {entry.value} µg/m³</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 col-span-1 lg:col-span-3">
                        <CardHeader className="border-b dark:border-gray-700">
                          <CardTitle>7-Day Forecast</CardTitle>
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
                                <Bar yAxisId="left" dataKey="temp" name="Temperature (°C)" fill="#8884d8" />
                                <Bar yAxisId="right" dataKey="precipitation" name="Precipitation (mm)" fill="#82ca9d" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 col-span-1 lg:col-span-3">
                        <CardHeader className="border-b dark:border-gray-700">
                          <CardTitle>Air Quality History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={weatherData.airQualityHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                                <XAxis dataKey="date" stroke={darkMode ? "#fff" : "#000"} />
                                <YAxis stroke={darkMode ? "#fff" : "#000"} />
                                <Tooltip contentStyle={{ backgroundColor: darkMode ? "#1f2937" : "#fff", color: darkMode ? "#fff" : "#000" }} />
                                <Legend />
                                <Line type="monotone" dataKey="pm10" name="PM10" stroke="#8884d8" strokeWidth={2} />
                                <Line type="monotone" dataKey="pm2_5" name="PM2.5" stroke="#82ca9d" strokeWidth={2} />
                                <Line type="monotone" dataKey="o3" name="Ozone" stroke="#ffc658" strokeWidth={2} />
                                <Line type="monotone" dataKey="no2" name="NO₂" stroke="#ff8042" strokeWidth={2} />
                                <Line type="monotone" dataKey="so2" name="SO₂" stroke="#00C49F" strokeWidth={2} />
                              </LineChart>
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

function WeatherParticles() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <g className="animate-float-slow">
        <circle cx="10%" cy="20%" r="8" fill="white" opacity="0.3" />
        <circle cx="25%" cy="60%" r="6" fill="white" opacity="0.3" />
        <circle cx="40%" cy="40%" r="10" fill="white" opacity="0.3" />
        <circle cx="60%" cy="30%" r="7" fill="white" opacity="0.3" />
        <circle cx="75%" cy="70%" r="9" fill="white" opacity="0.3" />
        <circle cx="90%" cy="50%" r="8" fill="white" opacity="0.3" />
      </g>
      <g className="animate-float-fast">
        <path d="M30 20 Q 40 15, 50 20 T 70 20" stroke="white" fill="transparent" opacity="0.2" />
        <path d="M50 40 Q 60 35, 70 40 T 90 40" stroke="white" fill="transparent" opacity="0.2" />
        <path d="M70 60 Q 80 55, 90 60 T 110 60" stroke="white" fill="transparent" opacity="0.2" />
      </g>
    </svg>
  )
}