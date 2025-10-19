function getSeasonFlags(month) {
  return {
    season_spring: [3, 4, 5].includes(month) ? 1 : 0,
    season_summer: [6, 7, 8].includes(month) ? 1 : 0,
    season_winter: [12, 1, 2].includes(month) ? 1 : 0,
  };
}

function getWeatherCode() {
  const weatherCodes = [3.0, 4.0, 5.0, 6.0, 7.0, 10.0, 98.0, 99.0];
  return weatherCodes[Math.floor(Math.random() * weatherCodes.length)];
}

function getRoadCondCode() {
  const roadCondCodes = [2, 3, 6, 7, 8, 9, 98, 99];
  return roadCondCodes[Math.floor(Math.random() * roadCondCodes.length)];
}

function oneHotWeather(code) {
  const keys = [
    "weather_3_0",
    "weather_4_0",
    "weather_5_0",
    "weather_6_0",
    "weather_7_0",
    "weather_10_0",
    "weather_98_0",
    "weather_99_0",
  ];
  const obj = {};
  keys.forEach((k) => (obj[k] = 0));
  const key = `weather_${code.toString().replace(".", "_")}`;
  if (obj.hasOwnProperty(key)) obj[key] = 1;
  return obj;
}

function oneHotRoadCond(code) {
  const keys = [
    "road_cond_2",
    "road_cond_3",
    "road_cond_6",
    "road_cond_7",
    "road_cond_8",
    "road_cond_9",
    "road_cond_98",
    "road_cond_99",
  ];
  const obj = {};
  keys.forEach((k) => (obj[k] = 0));
  const key = `road_cond_${code}`;
  if (obj.hasOwnProperty(key)) obj[key] = 1;
  return obj;
}

// Main function: prepare full feature vector
export function prepareFeatures(lat, lng) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const hour = now.getHours();
  const day = now.getDay();

  return {
    latitude: lat,
    longitude: lng,
    month: month,
    hour: hour,
    day: day
  };
}
