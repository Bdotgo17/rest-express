import { useQuery } from "@tanstack/react-query";
import { Truck, MapPin, ArrowLeftRight, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { DriverCard } from "@/components/driver-card";
import { SwapCard } from "@/components/swap-card";
import { AddSwapDialog } from "@/components/add-swap-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Driver, SwapPoint, Swap } from "@shared/schema";

export default function Dashboard() {
  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const { data: swapPoints = [], isLoading: swapPointsLoading } = useQuery<SwapPoint[]>({
    queryKey: ["/api/swap-points"],
  });

  const { data: swaps = [], isLoading: swapsLoading } = useQuery<Swap[]>({
    queryKey: ["/api/swaps"],
  });

  const isLoading = driversLoading || swapPointsLoading || swapsLoading;

  const activeDrivers = drivers.filter(d => d.status !== "offline").length;
  const activeSwaps = swaps.filter(s => s.status === "in-progress" || s.status === "scheduled").length;
  const completedToday = swaps.filter(s => s.status === "completed").length;
  const delayedDrivers = drivers.filter(d => d.status === "delayed").length;

  const recentSwaps = swaps.slice(0, 3);
  const activeDriversList = drivers.filter(d => d.status !== "offline").slice(0, 4);

  const getDriver = (id: string) => drivers.find(d => d.id === id);
  const getSwapPoint = (id: string) => swapPoints.find(sp => sp.id === id);

  if (isLoading) {
    return (
      <div className="p-6 space-y-8" data-testid="dashboard-loading">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8" data-testid="dashboard-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of your driver swap operations
          </p>
        </div>
        <AddSwapDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Drivers"
          value={activeDrivers}
          icon={<Truck className="h-5 w-5 text-primary" />}
          description={`${drivers.length} total drivers`}
        />
        <StatsCard
          title="Swap Points"
          value={swapPoints.length}
          icon={<MapPin className="h-5 w-5 text-primary" />}
        />
        <StatsCard
          title="Active Swaps"
          value={activeSwaps}
          icon={<ArrowLeftRight className="h-5 w-5 text-primary" />}
        />
        <StatsCard
          title="Completed Today"
          value={completedToday}
          icon={<CheckCircle className="h-5 w-5 text-primary" />}
        />
      </div>

      {delayedDrivers > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            </div>
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-400">
                {delayedDrivers} driver{delayedDrivers > 1 ? 's' : ''} delayed
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-500">
                Some drivers are experiencing delays. Check the drivers page for details.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
            <CardTitle className="text-lg font-semibold">Active Drivers</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {activeDriversList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Truck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No active drivers</p>
                <p className="text-xs text-muted-foreground">Drivers will appear here when they're online</p>
              </div>
            ) : (
              activeDriversList.map((driver) => (
                <DriverCard key={driver.id} driver={driver} />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
            <CardTitle className="text-lg font-semibold">Recent Swaps</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {recentSwaps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ArrowLeftRight className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No swaps scheduled</p>
                <p className="text-xs text-muted-foreground">Schedule a swap to get started</p>
              </div>
            ) : (
              recentSwaps.map((swap) => (
                <SwapCard
                  key={swap.id}
                  swap={swap}
                  driver1={getDriver(swap.driver1Id)}
                  driver2={getDriver(swap.driver2Id)}
                  swapPoint={getSwapPoint(swap.swapPointId)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
