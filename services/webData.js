const https = require('https');
const http = require('http');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const requestModule = url.startsWith('https') ? https : http;
        
        requestModule.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('Failed to parse JSON: ' + error.message));
                }
            });
        }).on('error', (error) => {
            reject(new Error('Request failed: ' + error.message));
        });
    });
}



async function getWeatherData(location) {
    try {
        const geocodeUrl = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(location) + '&count=1&language=en&format=json';
        
        const geocodeData = await makeRequest(geocodeUrl);
        
        if (!geocodeData.results || geocodeData.results.length === 0) {
            throw new Error('Location not found: ' + location);
        }
        
        const { latitude, longitude, name, country, admin1 } = geocodeData.results[0];
        
        const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + latitude + '&longitude=' + longitude + '&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&timezone=auto';
        
        const weatherData = await makeRequest(weatherUrl);
        
        const weatherCodes = {
            0: "Clear sky",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Fog",
            48: "Depositing rime fog",
            51: "Light drizzle",
            53: "Moderate drizzle",
            55: "Dense drizzle",
            61: "Slight rain",
            63: "Moderate rain",
            65: "Heavy rain",
            71: "Slight snowfall",
            73: "Moderate snowfall",
            75: "Heavy snowfall",
            80: "Slight rain showers",
            81: "Moderate rain showers",
            82: "Violent rain showers",
            95: "Thunderstorm",
            96: "Thunderstorm with slight hail",
            99: "Thunderstorm with heavy hail"
        };
        
        const current = weatherData.current;
        const weatherDescription = weatherCodes[current.weather_code] || "Unknown weather";
        
        return {
            location: name + ', ' + (admin1 ? admin1 + ', ' : '') + country,
            coordinates: { latitude, longitude },
            temperature: Math.round(current.temperature_2m),
            feels_like: Math.round(current.apparent_temperature),
            humidity: current.relative_humidity_2m,
            wind_speed: Math.round(current.wind_speed_10m),
            wind_direction: current.wind_direction_10m,
            weather_description: weatherDescription,
            weather_code: current.weather_code,
            is_day: current.is_day === 1,
            timezone: weatherData.timezone,
            last_updated: current.time,
            raw_data: weatherData
        };
    } catch (error) {
        throw new Error('Failed to get weather data: ' + error.message);
    }
}

module.exports = {
    getWeatherData
};

/*
@Author: Sujit Sharma
Community: https://discord.gg/XkXSRrRE3P (SoizX Devs™)
Reach out for support or credits.
*/
