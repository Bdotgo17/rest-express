import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeftRight, MapPin, Clock, Navigation } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { useRoute } from "@/hooks/use-route";
import type { Swap, SwapStatus, Driver, SwapPoint } from "@shared/schema";

interface SwapCardProps {
  swap: Swap;
  driver1?: Driver;
  driver2?: Driver;
  swapPoint?: SwapPoint | null;
}

function DriverETA({ driver, destLat, destLon, driverId }: { 
  driver?: Driver; 
  destLat: string | null | undefined; 
  destLon: string | null | undefined;
  driverId: string;
}) {
  const { data: routeInfo, isLoading } = useRoute(
    driver?.latitude,
    driver?.longitude,
    destLat,
    destLon
  );

  if (!driver || !destLat || !destLon) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
        <Navigation className="h-3 w-3" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!routeInfo) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full" data-testid={`eta-${driverId}`}>
      <Navigation className="h-3 w-3" />
      <span data-testid={`distance-${driverId}`}>{routeInfo.distance} mi</span>
      <span className="font-medium" data-testid={`time-${driverId}`}>{routeInfo.eta}</span>
    </div>
  );
}

export function SwapCard({ swap, driver1, driver2, swapPoint }: SwapCardProps) {
  const destLat = swapPoint?.latitude || swap.customLatitude;
  const destLon = swapPoint?.longitude || swap.customLongitude;

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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

  return (
    <Card className="hover-elevate" data-testid={`card-swap-${swap.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <StatusBadge status={swap.status as SwapStatus} type="swap" />
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-xs">{formatTime(swap.scheduledTime)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <Avatar className="h-14 w-14 border-2 border-muted">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {getInitials(driver1?.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate max-w-full px-2 text-center" data-testid={`text-driver1-name-${swap.id}`}>
              {driver1?.name || "Unknown Driver"}
            </span>
            <DriverETA driver={driver1} destLat={destLat} destLon={destLon} driverId={`driver1-${swap.id}`} />
          </div>
          
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <ArrowLeftRight className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <Avatar className="h-14 w-14 border-2 border-muted">
              <AvatarFallback className="bg-accent text-accent-foreground font-semibold text-lg">
                {getInitials(driver2?.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate max-w-full px-2 text-center" data-testid={`text-driver2-name-${swap.id}`}>
              {driver2?.name || "Unknown Driver"}
            </span>
            <DriverETA driver={driver2} destLat={destLat} destLon={destLon} driverId={`driver2-${swap.id}`} />
          </div>
        </div>
        
        {(swapPoint || swap.customLocation) && (
          <div className="flex items-center gap-2 pt-4 border-t text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate" data-testid={`text-swap-location-${swap.id}`}>
              {swapPoint?.name || swap.customLocation}
            </span>
          </div>
        )}
        
        {swap.notes && (
          <p className="mt-2 text-sm text-muted-foreground italic">
            {swap.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
