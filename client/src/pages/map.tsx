import { useQuery } from "@tanstack/react-query";
import { MapView } from "@/components/map-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin } from "lucide-react";
import type { Driver, SwapPoint } from "@shared/schema";

export default function Map() {
  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const { data: swapPoints = [], isLoading: swapPointsLoading } = useQuery<SwapPoint[]>({
    queryKey: ["/api/swap-points"],
  });

  const isLoading = driversLoading || swapPointsLoading;

  const driversWithLocation = drivers.filter(d => d.latitude && d.longitude);
  const swapPointsWithLocation = swapPoints.filter(sp => sp.latitude && sp.longitude);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="map-loading">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="map-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
            Live Map
          </h1>
          <p className="text-sm text-muted-foreground">
            View driver and swap point locations in real-time
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="gap-2" data-testid="badge-drivers-count">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            {driversWithLocation.length} Drivers
          </Badge>
          <Badge variant="outline" className="gap-2" data-testid="badge-swap-points-count">
            <div className="h-3 w-3 rounded-full bg-orange-500" />
            {swapPointsWithLocation.length} Swap Points
          </Badge>
        </div>
      </div>

      <MapView 
        drivers={drivers} 
        swapPoints={swapPoints}
        className="h-[500px]"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Drivers on Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            {driversWithLocation.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No drivers with GPS coordinates
              </p>
            ) : (
              <div className="space-y-2">
                {driversWithLocation.map(driver => (
                  <div 
                    key={driver.id} 
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                    data-testid={`row-driver-${driver.id}`}
                  >
                    <div>
                      <p className="font-medium" data-testid={`text-driver-name-${driver.id}`}>{driver.name}</p>
                      <p className="text-xs text-muted-foreground" data-testid={`text-driver-truck-${driver.id}`}>{driver.truckId}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs font-mono" data-testid={`badge-driver-coords-${driver.id}`}>
                      {driver.latitude}, {driver.longitude}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Swap Points on Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            {swapPointsWithLocation.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No swap points with GPS coordinates
              </p>
            ) : (
              <div className="space-y-2">
                {swapPointsWithLocation.map(swapPoint => (
                  <div 
                    key={swapPoint.id} 
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                    data-testid={`row-swap-point-${swapPoint.id}`}
                  >
                    <div>
                      <p className="font-medium" data-testid={`text-swap-point-name-${swapPoint.id}`}>{swapPoint.name}</p>
                      <p className="text-xs text-muted-foreground" data-testid={`text-swap-point-address-${swapPoint.id}`}>{swapPoint.address}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs font-mono" data-testid={`badge-swap-point-coords-${swapPoint.id}`}>
                      {swapPoint.latitude}, {swapPoint.longitude}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
