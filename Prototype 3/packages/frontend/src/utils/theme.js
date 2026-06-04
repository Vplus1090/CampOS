/**
 * Calculates whether it is currently daytime at a given latitude/longitude.
 * Noida coordinates used as default: lat = 28.628, lon = 77.38
 */
export function getSunriseSunset(lat = 28.628, lon = 77.38, date = new Date()) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  
  // Solar declination (angle of sun relative to equator)
  const declination = 23.45 * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365);
  
  // Convert latitude and declination to radians
  const latRad = (lat * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;
  
  // Hour angle (half of day length in degrees)
  const cosH = -Math.tan(latRad) * Math.tan(decRad);
  
  let hourAngle = 90; // Default if division fails or polar day/night
  if (cosH >= -1 && cosH <= 1) {
    hourAngle = (Math.acos(cosH) * 180) / Math.PI;
  }
  
  const dayLengthHours = (2 * hourAngle) / 15;
  
  // Timezone offset in hours
  const timezoneOffset = -date.getTimezoneOffset() / 60;
  
  // Solar noon offset based on longitude
  const lstm = 15 * timezoneOffset;
  const longitudeCorrection = (lstm - lon) / 15; // in hours
  
  // Equation of Time approximation (in minutes, converted to hours)
  const b = (2 * Math.PI * (dayOfYear - 81)) / 364;
  const eqTime = (9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b)) / 60;
  
  const solarNoon = 12 + longitudeCorrection - eqTime;
  
  const sunrise = solarNoon - dayLengthHours / 2;
  const sunset = solarNoon + dayLengthHours / 2;
  
  return { sunrise, sunset };
}

export function isDaytime() {
  const lat = parseFloat(localStorage.getItem('campos-lat')) || 28.628;
  const lon = parseFloat(localStorage.getItem('campos-lon')) || 77.38;
  
  const now = new Date();
  const { sunrise, sunset } = getSunriseSunset(lat, lon, now);
  
  const currentHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  return currentHour >= sunrise && currentHour < sunset;
}

export function applyThemeMode(modeId) {
  document.body.classList.remove('mode-light', 'mode-dark');
  
  if (modeId === 'light') {
    document.body.classList.add('mode-light');
  } else if (modeId === 'dark') {
    document.body.classList.add('mode-dark');
  } else if (modeId === 'auto') {
    const isDay = isDaytime();
    document.body.classList.add(isDay ? 'mode-light' : 'mode-dark');
  }
}

/**
 * Attempts to request the user's geolocation and updates the coordinates in localStorage.
 * If successful, re-evaluates the auto mode theme.
 */
export function initGeolocation(onLocationUpdated) {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        localStorage.setItem('campos-lat', latitude);
        localStorage.setItem('campos-lon', longitude);
        if (onLocationUpdated) {
          onLocationUpdated();
        }
      },
      (error) => {
        console.warn('Geolocation permission denied or error. Defaulting to Noida campus coordinates.', error);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 86400000 }
    );
  }
}
