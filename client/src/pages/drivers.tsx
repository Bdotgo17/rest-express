import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Users, Filter } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DriverCard } from "@/components/driver-card";
import { AddDriverDialog } from "@/components/add-driver-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Driver, DriverStatus } from "@shared/schema";

export default function Drivers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: drivers = [], isLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DriverStatus }) => {
      return apiRequest("PATCH", `/api/drivers/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
    },
  });

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch = 
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.truckId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCall = (driver: Driver) => {
    toast({
      title: "Calling driver",
      description: `Initiating call to ${driver.name} at ${driver.phone}`,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="drivers-loading">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="drivers-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
            Drivers
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and monitor your truck drivers
          </p>
        </div>
        <AddDriverDialog />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or truck ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-drivers"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40" data-testid="select-filter-status">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="en-route">En Route</SelectItem>
            <SelectItem value="waiting">Waiting</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredDrivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
          {drivers.length === 0 ? (
            <>
              <h3 className="text-lg font-medium mb-1">No drivers yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first driver to get started
              </p>
              <AddDriverDialog 
                trigger={
                  <Button data-testid="button-add-first-driver">
                    Add First Driver
                  </Button>
                }
              />
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium mb-1">No drivers found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDrivers.map((driver) => (
            <DriverCard 
              key={driver.id} 
              driver={driver} 
              onCall={handleCall}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
        <span>
          Showing {filteredDrivers.length} of {drivers.length} drivers
        </span>
      </div>
    </div>
  );
}
