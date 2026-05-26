import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Loader2, CheckCircle, XCircle, Truck, RefreshCw, ArrowLeftRight, Clock, Square } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRoute } from "@/hooks/use-route";
import type { Driver, Swap, SwapPoint } from "@shared/schema";

const statusColors: Record<string, string> = {
  available: "bg-green-500",
  "en-route": "bg-blue-500",
  waiting: "bg-yellow-500",
  delayed: "bg-orange-500",
  offline: "bg-gray-500",
};

function DriverETABlock({
  driver,
  destLat,
  destLon,
  isMe,
}: {
  driver: Driver | undefined;
  destLat: string | null | undefined;
  destLon: string | null | undefined;
  isMe: boolean;
}) {
  const { data: routeInfo, isLoading } = useRoute(
    driver?.latitude,
    driver?.longitude,
    destLat,
    destLon
  );

  if (!driver) {
    return (
      <div className="flex flex-col items-center gap-1 p-4 rounded-xl bg-muted/50 flex-1">
        <div className="text-sm text-muted-foreground italic">Unknown driver</div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center gap-2 p-4 rounded-xl flex-1 ${
        isMe ? "bg-primary/10 border-2 border-primary" : "bg-muted/50 border"
      }`}
      data-testid={`block-driver-${driver.id}`}
    >
      <div className="flex items-center gap-1.5">
        <div className={`w-2.5 h-2.5 rounded-full ${statusColors[driver.status]}`} />
        <span className="text-sm font-semibold text-center leading-tight">{driver.name}</span>
        {isMe && <span className="text-xs text-primary font-bold">(You)</span>}
      </div>

      <div className="text-xs text-muted-foreground">{driver.truckId}</div>

      <div className="w-full border-t my-1" />

      {!destLat || !destLon ? (
        <div className="text-xs text-muted-foreground italic text-center">No swap point GPS</div>
      ) : !driver.latitude || !driver.longitude ? (
        <div className="text-xs text-muted-foreground italic text-center">
          {isMe ? "Share your GPS to see ETA" : "Waiting for GPS..."}
        </div>
      ) : isLoading ? (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Calculating...</span>
        </div>
      ) : routeInfo ? (
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 text-2xl font-bold text-foreground">
            <Navigation className="h-5 w-5 text-primary" />
            <span>{routeInfo.eta}</span>
          </div>
          <div className="text-xs text-muted-foreground">{routeInfo.distance} miles away</div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground italic text-center">ETA unavailable</div>
      )}
    </div>
  );
}

export default function DriverMobile() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
    refetchInterval: 15000,
  });

  const { data: swaps = [] } = useQuery<Swap[]>({
    queryKey: ["/api/swaps"],
    refetchInterval: 15000,
  });

  const { data: swapPoints = [] } = useQuery<SwapPoint[]>({
    queryKey: ["/api/swap-points"],
  });

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  const activeSwap = swaps.find(
    s => s.status === "scheduled" || s.status === "in-progress"
  );

  const driver1 = activeSwap ? drivers.find(d => d.id === activeSwap.driver1Id) : undefined;
  const driver2 = activeSwap ? drivers.find(d => d.id === activeSwap.driver2Id) : undefined;
  const swapPoint = activeSwap?.swapPointId ? swapPoints.find(sp => sp.id === activeSwap.swapPointId) : undefined;
  const destLat = activeSwap ? (swapPoint?.latitude || activeSwap.customLatitude) : undefined;
  const destLon = activeSwap ? (swapPoint?.longitude || activeSwap.customLongitude) : undefined;
  const locationName = swapPoint?.name || activeSwap?.customLocation || "Swap Point";

  const swapDriverIds = activeSwap ? [activeSwap.driver1Id, activeSwap.driver2Id] : [];
  const swapDrivers = drivers.filter(d => swapDriverIds.includes(d.id));

  const formatTime = (timeStr: string) => {
    try {
      return new Date(timeStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return timeStr;
    }
  };

  const updateLocationMutation = useMutation({
    mutationFn: async (data: { driverId: string; latitude: string; longitude: string }) => {
      return apiRequest("PATCH", `/api/drivers/${data.driverId}`, {
        latitude: data.latitude,
        longitude: data.longitude,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      setLastUpdate(new Date());
    },
  });

  const getCurrentPosition = useCallback((driverId?: string) => {
    const targetDriverId = driverId || selectedDriverId;
    if (!navigator.geolocation) {
      setLocationError("GPS not supported by your browser");
      return;
    }
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition({ lat: latitude, lng: longitude });
        if (targetDriverId) {
          updateLocationMutation.mutate({
            driverId: targetDriverId,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          });
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location access denied. Please enable GPS.");
        } else {
          setLocationError("Could not get your location. Please try again.");
        }
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [selectedDriverId, updateLocationMutation]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isTracking && selectedDriverId) {
      intervalId = setInterval(() => getCurrentPosition(), 30000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isTracking, selectedDriverId, getCurrentPosition]);

  const handleSelect = (driverId: string) => {
    setSelectedDriverId(driverId);
    setIsTracking(true);
    getCurrentPosition(driverId);
    toast({ title: "Tracking started", description: "Your location is now being shared." });
  };

  const handleStop = () => {
    setIsTracking(false);
    setSelectedDriverId("");
    setCurrentPosition(null);
    setLastUpdate(null);
  };

  if (driversLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-10">
      <div className="max-w-sm mx-auto space-y-5">

        <div className="text-center pt-6 pb-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Truck className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">SwapTrack</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {isTracking ? `Tracking as ${selectedDriver?.name}` : "Tap your name to start"}
          </p>
        </div>

        {activeSwap ? (
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{locationName}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(activeSwap.scheduledTime)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DriverETABlock
                  driver={driver1}
                  destLat={destLat}
                  destLon={destLon}
                  isMe={selectedDriverId === driver1?.id}
                />
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
                  <ArrowLeftRight className="h-4 w-4 text-primary" />
                </div>
                <DriverETABlock
                  driver={driver2}
                  destLat={destLat}
                  destLon={destLon}
                  isMe={selectedDriverId === driver2?.id}
                />
              </div>

              {(!destLat || !destLon) && (
                <p className="text-xs text-muted-foreground text-center italic">
                  Add GPS coordinates to the swap point to see ETAs.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-4 text-center text-muted-foreground text-sm py-8">
              No active swap scheduled yet.
            </CardContent>
          </Card>
        )}

        {!isTracking ? (
          <div className="space-y-2">
            <p className="text-center text-sm font-medium text-muted-foreground">Who are you?</p>
            {swapDrivers.length > 0 ? swapDrivers.map(driver => (
              <button
                key={driver.id}
                onClick={() => handleSelect(driver.id)}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-muted hover:border-primary hover:bg-primary/5 transition-all"
                data-testid={`button-select-driver-${driver.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${statusColors[driver.status]}`} />
                  <div className="text-left">
                    <div className="font-semibold">{driver.name}</div>
                    <div className="text-sm text-muted-foreground">{driver.truckId}</div>
                  </div>
                </div>
                <CheckCircle className="h-6 w-6 text-primary" />
              </button>
            )) : drivers.map(driver => (
              <button
                key={driver.id}
                onClick={() => handleSelect(driver.id)}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-muted hover:border-primary hover:bg-primary/5 transition-all"
                data-testid={`button-select-driver-${driver.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${statusColors[driver.status]}`} />
                  <div className="text-left">
                    <div className="font-semibold">{driver.name}</div>
                    <div className="text-sm text-muted-foreground">{driver.truckId}</div>
                  </div>
                </div>
                <CheckCircle className="h-6 w-6 text-primary" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">GPS tracking active</span>
              </div>
              <Button variant="destructive" size="sm" onClick={handleStop} data-testid="button-stop-tracking">
                <Square className="h-3 w-3 mr-1" />
                Stop
              </Button>
            </div>

            {locationError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <XCircle className="h-4 w-4 shrink-0" />
                {locationError}
              </div>
            )}

            {lastUpdate && (
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Updated {lastUpdate.toLocaleTimeString()}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => getCurrentPosition()}
                  disabled={updateLocationMutation.isPending}
                  data-testid="button-update-now"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Update now
                </Button>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pt-2">
          ETAs refresh every 15 seconds · Add to home screen for quick access
        </p>
      </div>
    </div>
  );
}
