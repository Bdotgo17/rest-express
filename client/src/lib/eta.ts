// ETA calculation utilities - Haversine fallback for when routing is unavailable

export interface RouteInfo {
  distance: string;
  eta: string;
}

// Fetch actual road distance from OSRM via our API
export async function fetchRouteDistance(
  fromLat: string | null | undefined,
  fromLon: string | null | undefined,
  toLat: string | null | undefined,
  toLon: string | null | undefined
): Promise<RouteInfo | null> {
  if (!fromLat || !fromLon || !toLat || !toLon) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      fromLat,
      fromLon,
      toLat,
      toLon
    });
    
    const response = await fetch(`/api/route?${params}`);
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return {
      distance: String(data.distance),
      eta: data.durationFormatted
    };
  } catch (error) {
    console.error("Failed to fetch route:", error);
    return null;
  }
}

// Haversine formula for straight-line distance (fallback)
export function haversineDistance(
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

// Calculate ETA based on distance and speed (fallback for when API unavailable)
export function calculateETA(
  distanceMiles: number,
  speedMph: number = 55
): { hours: number; minutes: number; text: string } {
  const totalHours = distanceMiles / speedMph;
  let hours = Math.floor(totalHours);
  let minutes = Math.round((totalHours - hours) * 60);
  
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

// Get ETA using Haversine (fallback, synchronous)
export function getETAFromCoords(
  fromLat: string | undefined | null,
  fromLon: string | undefined | null,
  toLat: string | undefined | null,
  toLon: string | undefined | null
): RouteInfo | null {
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

  const distance = haversineDistance(lat1, lon1, lat2, lon2);
  const eta = calculateETA(distance);

  if (isNaN(distance)) {
    return null;
  }

  return {
    distance: distance.toFixed(1),
    eta: eta.text
  };
}
