import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Loader2, CheckCircle, XCircle, Truck, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Driver } from "@shared/schema";

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

export default function DriverMobile() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  const updateLocationMutation = useMutation({
    mutationFn: async (data: { latitude: string; longitude: string }) => {
      return apiRequest("PATCH", `/api/drivers/${selectedDriverId}`, data);
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

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("GPS is not supported by your browser");
      return;
    }

    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition({ lat: latitude, lng: longitude });
        
        if (selectedDriverId) {
          updateLocationMutation.mutate({
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
      getCurrentPosition();
      intervalId = setInterval(getCurrentPosition, 30000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isTracking, selectedDriverId, getCurrentPosition]);

  const handleStartTracking = () => {
    if (!selectedDriverId) {
      toast({
        title: "Select yourself",
        description: "Please select your name from the list first.",
        variant: "destructive",
      });
      return;
    }
    setIsTracking(true);
    getCurrentPosition();
  };

  const handleStopTracking = () => {
    setIsTracking(false);
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
          <p className="text-muted-foreground text-sm">Share your location with dispatch</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Select Your Name</CardTitle>
            <CardDescription>Choose your driver profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger data-testid="select-driver-mobile">
                <SelectValue placeholder="Select your name..." />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name} - {driver.truckId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedDriver && (
          <>
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

                {isTracking ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm font-medium">Sharing location every 30 seconds</span>
                    </div>
                    <Button 
                      onClick={handleStopTracking} 
                      variant="destructive" 
                      className="w-full"
                      data-testid="button-stop-tracking"
                    >
                      Stop Sharing Location
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleStartTracking} 
                    className="w-full" 
                    size="lg"
                    data-testid="button-start-tracking"
                  >
                    <Navigation className="h-5 w-5 mr-2" />
                    Start Sharing Location
                  </Button>
                )}

                <Button
                  onClick={getCurrentPosition}
                  variant="outline"
                  className="w-full"
                  disabled={!selectedDriverId || updateLocationMutation.isPending}
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

            {selectedDriver.currentLocation && (
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Current recorded location:</span>
                    <div className="mt-1">{selectedDriver.currentLocation}</div>
                    {selectedDriver.latitude && selectedDriver.longitude && (
                      <div className="text-xs mt-1 opacity-70">
                        GPS: {selectedDriver.latitude}, {selectedDriver.longitude}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>Tip: Add this page to your home screen for quick access</p>
        </div>
      </div>
    </div>
  );
}
