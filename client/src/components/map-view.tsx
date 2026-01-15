import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Driver, SwapPoint, DriverStatus } from "@shared/schema";
import { useRoute } from "@/hooks/use-route";

const driverIconColors: Record<DriverStatus, string> = {
  available: "#22c55e",
  "en-route": "#3b82f6",
  waiting: "#eab308",
  delayed: "#ef4444",
  offline: "#9ca3af",
};

function createDriverIcon(status: DriverStatus) {
  const color = driverIconColors[status] || "#9ca3af";
  return L.divIcon({
    className: "custom-driver-icon",
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 17h4V5H2v12h3m10 0h2.5a2 2 0 0 0 0-4H17V5h2v4a2 2 0 0 0 2 2h1"/>
          <circle cx="7.5" cy="17.5" r="2.5"/>
          <circle cx="17.5" cy="17.5" r="2.5"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const swapPointIcon = L.divIcon({
  className: "custom-swap-point-icon",
  html: `
    <div style="
      background-color: #f97316;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => [p[0], p[1]]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [map, positions]);
  
  return null;
}

interface DriverMarkerProps {
  driver: Driver;
  position: [number, number];
  swapPoint?: SwapPoint;
}

function DriverMarker({ driver, position, swapPoint }: DriverMarkerProps) {
  const { data: routeInfo, isLoading } = useRoute(
    driver.latitude,
    driver.longitude,
    swapPoint?.latitude,
    swapPoint?.longitude
  );

  return (
    <Marker
      position={position}
      icon={createDriverIcon(driver.status as DriverStatus)}
    >
      <Popup>
        <div className="text-sm" data-testid={`popup-driver-${driver.id}`}>
          <p className="font-semibold" data-testid={`text-driver-name-${driver.id}`}>{driver.name}</p>
          <p className="text-muted-foreground" data-testid={`text-driver-truck-${driver.id}`}>{driver.truckId}</p>
          <p className="capitalize" data-testid={`text-driver-status-${driver.id}`}>{driver.status}</p>
          {driver.currentLocation && (
            <p className="text-xs text-muted-foreground">{driver.currentLocation}</p>
          )}
          {swapPoint && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-xs font-medium">To {swapPoint.name}:</p>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Calculating...</p>
              ) : routeInfo ? (
                <p className="text-sm font-semibold" style={{ color: "#f97316" }} data-testid={`eta-to-swap-${driver.id}`}>
                  {routeInfo.distance} mi - {routeInfo.eta}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Unable to calculate</p>
              )}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

interface MapViewProps {
  drivers: Driver[];
  swapPoints: SwapPoint[];
  className?: string;
}

export function MapView({ drivers, swapPoints, className = "" }: MapViewProps) {
  const driverPositions: { driver: Driver; position: [number, number] }[] = [];
  const swapPointPositions: { swapPoint: SwapPoint; position: [number, number] }[] = [];

  drivers.forEach(driver => {
    if (driver.latitude && driver.longitude) {
      const lat = parseFloat(driver.latitude);
      const lng = parseFloat(driver.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        driverPositions.push({ driver, position: [lat, lng] });
      }
    }
  });

  swapPoints.forEach(swapPoint => {
    if (swapPoint.latitude && swapPoint.longitude) {
      const lat = parseFloat(swapPoint.latitude);
      const lng = parseFloat(swapPoint.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        swapPointPositions.push({ swapPoint, position: [lat, lng] });
      }
    }
  });

  const allPositions = [
    ...driverPositions.map(d => d.position),
    ...swapPointPositions.map(s => s.position),
  ];

  const defaultCenter: [number, number] = allPositions.length > 0 
    ? allPositions[0] 
    : [33.4484, -112.0740];

  if (allPositions.length === 0) {
    return (
      <div className={`rounded-lg overflow-hidden border ${className} flex items-center justify-center bg-muted/50`} data-testid="map-container-empty" style={{ minHeight: "400px" }}>
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No locations to display</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Add GPS coordinates to drivers or swap points to see them on the map. 
            You can enter an address and it will automatically look up the coordinates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden border ${className}`} data-testid="map-container">
      <MapContainer
        center={defaultCenter}
        zoom={6}
        style={{ height: "100%", width: "100%", minHeight: "400px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {allPositions.length > 0 && <FitBounds positions={allPositions} />}
        
        {driverPositions.map(({ driver, position }) => (
          <DriverMarker
            key={`driver-${driver.id}`}
            driver={driver}
            position={position}
            swapPoint={swapPointPositions[0]?.swapPoint}
          />
        ))}
        
        {swapPointPositions.map(({ swapPoint, position }) => (
          <Marker
            key={`swap-point-${swapPoint.id}`}
            position={position}
            icon={swapPointIcon}
          >
            <Popup>
              <div className="text-sm" data-testid={`popup-swap-point-${swapPoint.id}`}>
                <p className="font-semibold" data-testid={`text-swap-point-name-${swapPoint.id}`}>{swapPoint.name}</p>
                <p className="text-muted-foreground" data-testid={`text-swap-point-address-${swapPoint.id}`}>{swapPoint.address}</p>
                <p data-testid={`text-swap-point-capacity-${swapPoint.id}`}>Capacity: {swapPoint.capacity}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
