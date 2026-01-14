// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Calculate ETA based on distance and speed
export function calculateETA(
  distanceMiles: number,
  speedMph: number = 55
): { hours: number; minutes: number; text: string } {
  const totalHours = distanceMiles / speedMph;
  let hours = Math.floor(totalHours);
  let minutes = Math.round((totalHours - hours) * 60);
  
  // Handle rounding that pushes minutes to 60
  if (minutes >= 60) {
    hours += 1;
    minutes = 0;
  }
  
  let text = "";
  if (hours > 0) {
    text += `${hours}h `;
  }
  text += `${minutes}m`;
  
  return { hours, minutes, text };
}

// Get ETA text from coordinates
export function getETAFromCoords(
  fromLat: string | undefined | null,
  fromLon: string | undefined | null,
  toLat: string | undefined | null,
  toLon: string | undefined | null,
  speedMph: number = 55
): { distance: number; eta: string } | null {
  if (!fromLat || !fromLon || !toLat || !toLon) {
    return null;
  }
  
  const lat1 = parseFloat(fromLat);
  const lon1 = parseFloat(fromLon);
  const lat2 = parseFloat(toLat);
  const lon2 = parseFloat(toLon);
  
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return null;
  }
  
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  const { text } = calculateETA(distance, speedMph);
  
  return { distance: Math.round(distance), eta: text };
}
