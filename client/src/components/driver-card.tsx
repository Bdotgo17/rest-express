import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Truck } from "lucide-react";
import { StatusBadge } from "./status-badge";
import type { Driver, DriverStatus } from "@shared/schema";

interface DriverCardProps {
  driver: Driver;
  onCall?: (driver: Driver) => void;
}

export function DriverCard({ driver, onCall }: DriverCardProps) {
  const initials = driver.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const statusIndicatorColors: Record<DriverStatus, string> = {
    available: "bg-green-500 dark:bg-green-400",
    "en-route": "bg-blue-500 dark:bg-blue-400",
    waiting: "bg-yellow-500 dark:bg-yellow-400",
    delayed: "bg-red-500 dark:bg-red-400",
    offline: "bg-gray-400 dark:bg-gray-500",
  };

  return (
    <Card 
      className="hover-elevate"
      data-testid={`card-driver-${driver.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-muted">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div 
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${statusIndicatorColors[driver.status as DriverStatus] || "bg-gray-400 dark:bg-gray-500"}`}
              aria-label={`Status: ${driver.status}`}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg truncate" data-testid={`text-driver-name-${driver.id}`}>
                {driver.name}
              </h3>
              <StatusBadge status={driver.status as DriverStatus} type="driver" />
            </div>
            
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4 shrink-0" />
                <span className="font-mono" data-testid={`text-truck-id-${driver.id}`}>{driver.truckId}</span>
              </div>
              
              {driver.currentLocation && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{driver.currentLocation}</span>
                </div>
              )}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => onCall?.(driver)}
            data-testid={`button-call-driver-${driver.id}`}
          >
            <Phone className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
