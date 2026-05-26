import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Loader2, CheckCircle, XCircle, Truck, RefreshCw, UserPlus, ArrowLeft, Map, Square, ArrowLeftRight, Clock } from "lucide-react";
import { Link } from "wouter";
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

const statusLabels: Record<string, string> = {
  available: "Available",
  "en-route": "En Route",
  waiting: "Waiting",
  delayed: "Delayed",
  offline: "Offline",
};

function ETABadge({
  fromLat,
  fromLon,
  toLat,
  toLon,
  label,
}: {
  fromLat: string | null | undefined;
  fromLon: string | null | undefined;
  toLat: string | null | undefined;
  toLon: string | null | undefined;
  label: string;
}) {
  const { data: routeInfo, isLoading } = useRoute(fromLat, fromLon, toLat, toLon);

  if (!fromLat || !fromLon || !toLat || !toLon) {
    return (
      <div className="text-xs text-muted-foreground italic">No GPS yet</div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Calculating...</span>
      </div>
    );
  }

  if (!routeInfo) {
    return <div className="text-xs text-muted-foreground italic">ETA unavailable</div>;
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
        <Navigation className="h-3 w-3 text-primary" />
        <span>{routeInfo.eta}</span>
      </div>
      <div className="text-xs text-muted-foreground">{routeInfo.distance} mi away</div>
    </div>
  );
}

function SwapInfoCard({
  swap,
  myDriver,
  otherDriver,
  swapPoint,
}: {
  swap: Swap;
  myDriver: Driver;
  otherDriver: Driver | undefined;
  swapPoint: SwapPoint | undefined;
}) {
  const destLat = swapPoint?.latitude || swap.customLatitude;
  const destLon = swapPoint?.longitude || swap.customLongitude;
  const locationName = swapPoint?.name || swap.customLocation || "Custom Location";

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return timeStr;
    }
  };

  const swapStatusColor: Record<string, string> = {
    scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    "in-progress": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    completed: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
    cancelled: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
  };

  return (
    <Card className="border-primary/40" data-testid={`card-swap-info-${swap.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-primary" />
            Your Swap
          </CardTitle>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${swapStatusColor[swap.status] || ""}`}>
            {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatTime(swap.scheduledTime)}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {(destLat && destLon) ? (
          <div className="flex items-center gap-1.5 p-2 bg-muted rounded-md text-sm">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium truncate">{locationName}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 p-2 bg-muted rounded-md text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{locationName} (no GPS coordinates)</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${statusColors[myDriver.status]}`} />
              <span className="text-xs font-semibold truncate max-w-[90px]">{myDriver.name}</span>
            </div>
            <div className="text-xs text-muted-foreground">You</div>
            <ETABadge
              fromLat={myDriver.latitude}
              fromLon={myDriver.longitude}
              toLat={destLat}
              toLon={destLon}
              label="me"
            />
          </div>

          <div className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-lg border">
            {otherDriver ? (
              <>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${statusColors[otherDriver.status]}`} />
                  <span className="text-xs font-semibold truncate max-w-[90px]">{otherDriver.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">{statusLabels[otherDriver.status]}</div>
                <ETABadge
                  fromLat={otherDriver.latitude}
                  fromLon={otherDriver.longitude}
                  toLat={destLat}
                  toLon={destLon}
                  label="other"
                />
              </>
            ) : (
              <div className="text-xs text-muted-foreground italic text-center">Other driver not found</div>
            )}
          </div>
        </div>

        {!destLat || !destLon ? (
          <p className="text-xs text-muted-foreground text-center italic">
            ETAs will appear once the swap point has GPS coordinates.
          </p>
        ) : (!myDriver.latitude || !myDriver.longitude) ? (
          <p className="text-xs text-muted-foreground text-center italic">
            Your ETA will appear once your GPS is shared.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function DriverMobile() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerTruckId, setRegisterTruckId] = useState("");
  const { toast } = useToast();

  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
    refetchInterval: isTracking ? 15000 : false,
  });

  const { data: swaps = [] } = useQuery<Swap[]>({
    queryKey: ["/api/swaps"],
    refetchInterval: isTracking ? 15000 : false,
    enabled: isTracking,
  });

  const { data: swapPoints = [] } = useQuery<SwapPoint[]>({
    queryKey: ["/api/swap-points"],
    enabled: isTracking,
  });

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  const activeSwaps = swaps.filter(
    s =>
      (s.driver1Id === selectedDriverId || s.driver2Id === selectedDriverId) &&
      (s.status === "scheduled" || s.status === "in-progress")
  );

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string; truckId: string; status: string }) => {
      return apiRequest("POST", "/api/drivers", data);
    },
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      const newDriver = await response.json();
      handleSelectAndTrack(newDriver.id);
      setShowRegister(false);
      setRegisterName("");
      setRegisterPhone("");
      setRegisterTruckId("");
      toast({
        title: "Registered!",
        description: "Location tracking started automatically.",
      });
    },
    onError: () => {
      toast({
        title: "Registration failed",
        description: "Could not register. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRegister = () => {
    if (!registerName.trim() || !registerPhone.trim() || !registerTruckId.trim()) {
      toast({
        title: "Fill all fields",
        description: "Please enter your name, phone, and truck ID.",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate({
      name: registerName.trim(),
      phone: registerPhone.trim(),
      truckId: registerTruckId.trim(),
      status: "available",
    });
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
    onError: () => {
      toast({
        title: "Update failed",
        description: "Could not update your location. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest("PATCH", `/api/drivers/${selectedDriverId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({
        title: "Status updated",
        description: "Your status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Could not update your status.",
        variant: "destructive",
      });
    },
  });

  const getCurrentPosition = useCallback((driverId?: string) => {
    const targetDriverId = driverId || selectedDriverId;

    if (!navigator.geolocation) {
      setLocationError("GPS is not supported by your browser");
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
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied. Please enable GPS permissions.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location unavailable. Please try again.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out. Please try again.");
            break;
          default:
            setLocationError("An error occurred getting your location.");
        }
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [selectedDriverId, updateLocationMutation]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isTracking && selectedDriverId) {
      intervalId = setInterval(() => getCurrentPosition(), 30000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isTracking, selectedDriverId, getCurrentPosition]);

  const handleSelectAndTrack = (driverId: string) => {
    setSelectedDriverId(driverId);
    setIsTracking(true);
    getCurrentPosition(driverId);
    toast({
      title: "Tracking started",
      description: "Your location is now being shared.",
    });
  };

  const handleStopTracking = () => {
    setIsTracking(false);
    setSelectedDriverId("");
    setCurrentPosition(null);
    setLastUpdate(null);
  };

  if (driversLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">SwapTrack Driver</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {isTracking ? "Sharing your location" : "Tap the checkmark to start tracking"}
          </p>
        </div>

        {isTracking && selectedDriver ? (
          <>
            <Card className="border-primary border-2">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{selectedDriver.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedDriver.truckId}</div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleStopTracking}
                    data-testid="button-stop-tracking"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {activeSwaps.length > 0 && (
              <div className="space-y-3">
                {activeSwaps.map(swap => {
                  const otherId = swap.driver1Id === selectedDriverId ? swap.driver2Id : swap.driver1Id;
                  const otherDriver = drivers.find(d => d.id === otherId);
                  const swapPoint = swap.swapPointId ? swapPoints.find(sp => sp.id === swap.swapPointId) : undefined;
                  return (
                    <SwapInfoCard
                      key={swap.id}
                      swap={swap}
                      myDriver={selectedDriver}
                      otherDriver={otherDriver}
                      swapPoint={swapPoint}
                    />
                  );
                })}
              </div>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Your Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${statusColors[selectedDriver.status]}`} />
                  <span className="font-medium">{statusLabels[selectedDriver.status]}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(statusLabels).filter(([key]) => key !== "offline").map(([key, label]) => (
                    <Button
                      key={key}
                      variant={selectedDriver.status === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateStatusMutation.mutate(key)}
                      disabled={updateStatusMutation.isPending}
                      data-testid={`button-status-${key}`}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  GPS Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {locationError && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                    {locationError}
                  </div>
                )}

                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">Sharing location every 30 seconds</span>
                </div>

                {currentPosition && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-700 dark:text-green-400 rounded-md text-sm">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Location captured</div>
                      <div className="text-xs opacity-80">
                        {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
                      </div>
                    </div>
                  </div>
                )}

                {lastUpdate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </div>
                )}

                <Button
                  onClick={() => getCurrentPosition()}
                  variant="outline"
                  className="w-full"
                  disabled={updateLocationMutation.isPending}
                  data-testid="button-update-now"
                >
                  {updateLocationMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Update Location Now
                </Button>
              </CardContent>
            </Card>
          </>
        ) : showRegister ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowRegister(false)}
                  data-testid="button-back-to-select"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-lg">Register as Driver</CardTitle>
                  <CardDescription>Add yourself to the system</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  data-testid="input-register-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 555-123-4567"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  data-testid="input-register-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="truckId">Truck ID</Label>
                <Input
                  id="truckId"
                  placeholder="TRK-005"
                  value={registerTruckId}
                  onChange={(e) => setRegisterTruckId(e.target.value)}
                  data-testid="input-register-truck"
                />
              </div>
              <Button
                onClick={handleRegister}
                className="w-full"
                disabled={registerMutation.isPending}
                data-testid="button-register-submit"
              >
                {registerMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Register & Start Tracking
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Select Your Name</CardTitle>
              <CardDescription>Tap the checkmark to start sharing your location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {drivers.map((driver) => (
                <button
                  key={driver.id}
                  onClick={() => handleSelectAndTrack(driver.id)}
                  className="w-full flex items-center justify-between p-3 rounded-md border hover-elevate transition-colors"
                  data-testid={`button-select-driver-${driver.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${statusColors[driver.status]}`} />
                    <div className="text-left">
                      <div className="font-medium">{driver.name}</div>
                      <div className="text-sm text-muted-foreground">{driver.truckId}</div>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full border-2 border-primary flex items-center justify-center text-primary">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                </button>
              ))}

              <div className="pt-2 border-t mt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowRegister(true)}
                  data-testid="button-register-new"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register as New Driver
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-4">
            <Link href="/map">
              <Button variant="outline" className="w-full" data-testid="button-view-map">
                <Map className="h-4 w-4 mr-2" />
                View Map - See All Drivers
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>Tip: Add this page to your home screen for quick access</p>
        </div>
      </div>
    </div>
  );
}
