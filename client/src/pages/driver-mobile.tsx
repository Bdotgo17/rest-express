import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Navigation, CheckCircle, XCircle, RefreshCw, Square } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRoute } from "@/hooks/use-route";
import type { Driver } from "@shared/schema";

const TOYAH_LAT = "31.3138";
const TOYAH_LON = "-103.7960";
const TOYAH_NAME = "Toyah, TX";

function ETADisplay({ driver, isMe, showMiles }: { driver: Driver | undefined; isMe: boolean; showMiles: boolean }) {
  const { data: routeInfo, isLoading } = useRoute(
    driver?.latitude,
    driver?.longitude,
    TOYAH_LAT,
    TOYAH_LON
  );

  const label = driver?.name?.toLowerCase().includes("las cruces") ? "Las Cruces, NM" : "Merkle, TX";

  return (
    <div className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 ${
      isMe ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-gray-50"
    }`} data-testid={`eta-block-${label.toLowerCase().replace(" ", "-")}`}>
      <div className="text-sm font-bold text-gray-800">{label}</div>
      {isMe && <div className="text-xs font-semibold text-orange-500 uppercase tracking-wide">You</div>}

      <div className="w-full border-t border-gray-200 my-0.5" />

      {!driver?.latitude || !driver?.longitude ? (
        <div className="text-xs text-gray-400 text-center italic">
          {isMe ? "Waiting for GPS..." : "No GPS yet"}
        </div>
      ) : isLoading ? (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Calculating...</span>
        </div>
      ) : routeInfo ? (
        <div className="flex flex-col items-center gap-0">
          <div className="flex items-center gap-1 text-2xl font-bold text-gray-900">
            <Navigation className="h-4 w-4 text-orange-400" />
            <span>{routeInfo.eta}</span>
          </div>
          {showMiles && <div className="text-xs text-gray-500">{routeInfo.distance} mi</div>}
        </div>
      ) : (
        <div className="text-xs text-gray-400 italic">ETA unavailable</div>
      )}
    </div>
  );
}

export default function DriverApp() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: drivers = [], isLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
    refetchInterval: isTracking ? 15000 : false,
  });

  const abileneDriver = drivers.find(d => !d.name.toLowerCase().includes("las cruces"));
  const lasCrucesDriver = drivers.find(d => d.name.toLowerCase().includes("las cruces"));
  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  const updateLocationMutation = useMutation({
    mutationFn: async (data: { driverId: string; latitude: string; longitude: string }) => {
      return apiRequest("PATCH", `/api/drivers/${data.driverId}`, {
        latitude: data.latitude,
        longitude: data.longitude,
        status: "en-route",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      setLastUpdate(new Date());
    },
  });

  const getCurrentPosition = useCallback((driverId?: string) => {
    const targetId = driverId || selectedDriverId;
    if (!navigator.geolocation) {
      setLocationError("GPS not supported by your browser");
      return;
    }
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocationMutation.mutate({
          driverId: targetId,
          latitude: pos.coords.latitude.toString(),
          longitude: pos.coords.longitude.toString(),
        });
      },
      () => {
        setLocationError("Could not get your location. Please enable GPS.");
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [selectedDriverId, updateLocationMutation]);

  useEffect(() => {
    if (!isTracking || !selectedDriverId) return;
    const id = setInterval(() => getCurrentPosition(), 30000);
    return () => clearInterval(id);
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
    setLastUpdate(null);
    setLocationError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pt-6 pb-6 max-w-sm mx-auto">

      <div className="text-center mb-4">
        <div className="text-2xl mb-1">🔄</div>
        <h1 className="text-xl font-bold text-gray-900">Swap Meet</h1>
        <p className="text-gray-500 text-xs mt-0.5">Meeting in <span className="font-semibold text-orange-500">{TOYAH_NAME}</span></p>
      </div>

      <div className="flex gap-2 w-full mb-4">
        <ETADisplay driver={abileneDriver} isMe={selectedDriverId === abileneDriver?.id} showMiles={isTracking} />
        <ETADisplay driver={lasCrucesDriver} isMe={selectedDriverId === lasCrucesDriver?.id} showMiles={isTracking} />
      </div>

      {!isTracking ? (
        <div className="w-full space-y-2">
          <p className="text-center text-xs text-gray-400 font-medium">Who are you?</p>
          {abileneDriver && (
            <button
              onClick={() => handleSelect(abileneDriver.id)}
              className="w-full py-4 rounded-2xl bg-orange-500 text-white text-lg font-bold shadow-md active:scale-95 transition-transform"
              data-testid="button-select-abilene"
            >
              Merkle, TX
            </button>
          )}
          {lasCrucesDriver && (
            <button
              onClick={() => handleSelect(lasCrucesDriver.id)}
              className="w-full py-4 rounded-2xl bg-gray-800 text-white text-lg font-bold shadow-md active:scale-95 transition-transform"
              data-testid="button-select-las-cruces"
            >
              Las Cruces, NM
            </button>
          )}
        </div>
      ) : (
        <div className="w-full space-y-2">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
            <span className="text-sm font-semibold text-green-700">
              Sharing as <span className="text-green-900">
                {selectedDriver?.name?.includes("Abilene") ? "Abilene" : "Las Cruces"}
              </span>
            </span>
          </div>

          {locationError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs">
              <XCircle className="h-4 w-4 shrink-0" />
              {locationError}
            </div>
          )}

          {lastUpdate && (
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Updated {lastUpdate.toLocaleTimeString()}
              </div>
              <button
                onClick={() => getCurrentPosition()}
                className="flex items-center gap-1 text-orange-500 font-medium"
                data-testid="button-update-now"
              >
                <RefreshCw className="h-3 w-3" />
                Update now
              </button>
            </div>
          )}

          <button
            onClick={handleStop}
            className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
            data-testid="button-stop-tracking"
          >
            <Square className="h-4 w-4" />
            Stop tracking
          </button>
        </div>
      )}

      <p className="text-xs text-gray-300 text-center mt-4">
        Location updates every 30 seconds
      </p>
    </div>
  );
}
