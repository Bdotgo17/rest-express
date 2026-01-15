import { useQuery } from "@tanstack/react-query";

export interface RouteResult {
  distance: string;
  eta: string;
  approximate?: boolean;
}

async function fetchRoute(
  fromLat: string | null | undefined,
  fromLon: string | null | undefined,
  toLat: string | null | undefined,
  toLon: string | null | undefined
): Promise<RouteResult | null> {
  if (!fromLat || !fromLon || !toLat || !toLon) {
    return null;
  }

  const params = new URLSearchParams({
    fromLat,
    fromLon,
    toLat,
    toLon
  });
  
  try {
    const response = await fetch(`/api/route?${params}`);
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return {
      distance: String(data.distance),
      eta: data.durationFormatted,
      approximate: data.approximate || false
    };
  } catch (error) {
    console.error("Route fetch error:", error);
    return null;
  }
}

export function useRoute(
  fromLat: string | null | undefined,
  fromLon: string | null | undefined,
  toLat: string | null | undefined,
  toLon: string | null | undefined
) {
  return useQuery({
    queryKey: ["/api/route", fromLat, fromLon, toLat, toLon],
    queryFn: () => fetchRoute(fromLat, fromLon, toLat, toLon),
    enabled: !!(fromLat && fromLon && toLat && toLon),
    staleTime: 5 * 60 * 1000,
    retry: 1
  });
}
