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

const CITIES = {
  merkle: { label: "Merkle, TX", prefix: "Merkle" },
  lascruces: { label: "Las Cruces, NM", prefix: "Las Cruces" },
} as const;
type City = keyof typeof CITIES;

function DriverETARow({ driver, isMe }: { driver: Driver; isMe: boolean }) {
  const { data: routeInfo, isLoading } = useRoute(
    driver.latitude,
    driver.longitude,
    TOYAH_LAT,
    TOYAH_LON
  );

  const displayName = driver.name.includes(" - ")
    ? driver.name.split(" - ").slice(1).join(" - ")
    : driver.name;

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${
      isMe ? "bg-orange-50 border border-orange-300" : "bg-gray-50"
    }`}>
      <div className="flex items-center gap-2">
        {isMe && <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />}
        <span className={`text-sm font-medium ${isMe ? "text-orange-800" : "text-gray-700"}`}>
          {displayName} {isMe && <span className="text-xs text-orange-400">(you)</span>}
        </span>
      </div>
      <div className="text-right">
        {!driver.latitude || !driver.longitude ? (
          <span className="text-xs text-gray-400 italic">No GPS</span>
        ) : isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
        ) : routeInfo ? (
          <div className="flex items-center gap-1">
            <Navigation className="h-3 w-3 text-orange-400" />
            <span className="text-sm font-bold text-gray-900">{routeInfo.eta}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </div>
    </div>
  );
}

export default function DriverApp() {
  const [step, setStep] = useState<"city" | "name" | "tracking">("city");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [driverName, setDriverName] = useState("");
  const [myDriverId, setMyDriverId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
    refetchInterval: isTracking ? 15000 : 30000,
  });

  const merkleDrivers = drivers.filter(d =>
    d.name.toLowerCase().startsWith("merkle")
  );
  const lcDrivers = drivers.filter(d =>
    d.name.toLowerCase().startsWith("las cruces")
  );

  const findOrCreateDriver = useMutation({
    mutationFn: async ({ city, name }: { city: City; name: string }) => {
      const prefix = CITIES[city].prefix;
      const fullName = `${prefix} - ${name}`;
      const existing = drivers.find(
        d => d.name.toLowerCase() === fullName.toLowerCase()
      );
      if (existing) return existing;
      const res = await apiRequest("POST", "/api/drivers", {
        name: fullName,
        phone: "000-000-0000",
        truckId: `TRK-${name.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-4)}`,
        status: "en-route",
      });
      return res.json();
    },
    onSuccess: (driver: Driver) => {
      setMyDriverId(driver.id);
    },
  });

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
    const targetId = driverId || myDriverId;
    if (!targetId) return;
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
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [myDriverId, updateLocationMutation]);

  useEffect(() => {
    if (!isTracking || !myDriverId) return;
    const id = setInterval(() => getCurrentPosition(), 30000);
    return () => clearInterval(id);
  }, [isTracking, myDriverId, getCurrentPosition]);

  const handleStart = async () => {
    if (!selectedCity || !driverName.trim()) return;
    const driver = await findOrCreateDriver.mutateAsync({
      city: selectedCity,
      name: driverName.trim(),
    });
    setIsTracking(true);
    setStep("tracking");
    getCurrentPosition(driver.id);
    toast({ title: "Tracking started", description: "Your location is now being shared." });
  };

  const handleStop = () => {
    setIsTracking(false);
    setMyDriverId(null);
    setDriverName("");
    setSelectedCity(null);
    setLastUpdate(null);
    setLocationError(null);
    setStep("city");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pt-6 pb-6 max-w-sm mx-auto">
      <div className="text-center mb-4">
        <div className="text-2xl mb-1">🔄</div>
        <h1 className="text-xl font-bold text-gray-900">Swap Meet</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Meeting in <span className="font-semibold text-orange-500">{TOYAH_NAME}</span>
        </p>
      </div>

      {step === "city" && (
        <div className="w-full space-y-2">
          <p className="text-center text-xs text-gray-400 font-medium mb-3">Where are you driving from?</p>
          <button
            onClick={() => { setSelectedCity("merkle"); setStep("name"); }}
            className="w-full py-4 rounded-2xl bg-orange-500 text-white text-lg font-bold shadow-md active:scale-95 transition-transform"
            data-testid="button-select-merkle"
          >
            Merkle, TX
          </button>
          <button
            onClick={() => { setSelectedCity("lascruces"); setStep("name"); }}
            className="w-full py-4 rounded-2xl bg-gray-800 text-white text-lg font-bold shadow-md active:scale-95 transition-transform"
            data-testid="button-select-las-cruces"
          >
            Las Cruces, NM
          </button>
        </div>
      )}

      {step === "name" && selectedCity && (
        <div className="w-full space-y-3">
          <button
            onClick={() => setStep("city")}
            className="text-xs text-gray-400 flex items-center gap-1"
          >
            ← Back
          </button>
          <p className="text-center text-sm text-gray-600 font-medium">
            Driving from <span className="text-orange-500 font-bold">{CITIES[selectedCity].label}</span>
          </p>
          <input
            type="text"
            placeholder="Your name or initials"
            value={driverName}
            onChange={e => setDriverName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleStart()}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base focus:outline-none focus:border-orange-400"
            autoFocus
            data-testid="input-driver-name"
          />
          <button
            onClick={handleStart}
            disabled={!driverName.trim() || findOrCreateDriver.isPending}
            className="w-full py-4 rounded-2xl bg-orange-500 text-white text-lg font-bold shadow-md active:scale-95 transition-transform disabled:opacity-50"
            data-testid="button-start-tracking"
          >
            {findOrCreateDriver.isPending ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Starting...
              </div>
            ) : "Start Tracking"}
          </button>
        </div>
      )}

      {step === "tracking" && (
        <div className="w-full space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
            <span className="text-sm font-semibold text-green-700">
              Sharing as <span className="text-green-900">{driverName}</span>
              {selectedCity && <span className="text-green-600"> · {CITIES[selectedCity].label}</span>}
            </span>
          </div>

          {merkleDrivers.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Merkle, TX</p>
              {merkleDrivers.map(d => (
                <DriverETARow key={d.id} driver={d} isMe={d.id === myDriverId} />
              ))}
            </div>
          )}

          {lcDrivers.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Las Cruces, NM</p>
              {lcDrivers.map(d => (
                <DriverETARow key={d.id} driver={d} isMe={d.id === myDriverId} />
              ))}
            </div>
          )}

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
