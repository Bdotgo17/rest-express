import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, ArrowLeftRight, Filter } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SwapCard } from "@/components/swap-card";
import { AddSwapDialog } from "@/components/add-swap-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Driver, SwapPoint, Swap, SwapStatus } from "@shared/schema";

export default function Swaps() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: swaps = [], isLoading: swapsLoading } = useQuery<Swap[]>({
    queryKey: ["/api/swaps"],
  });

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const { data: swapPoints = [] } = useQuery<SwapPoint[]>({
    queryKey: ["/api/swap-points"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SwapStatus }) => {
      return apiRequest("PATCH", `/api/swaps/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swaps"] });
    },
  });

  const getDriver = (id: string) => drivers.find(d => d.id === id);
  const getSwapPoint = (id: string | null) => id ? swapPoints.find(sp => sp.id === id) : null;

  const filteredSwaps = swaps.filter((swap) => {
    const driver1 = getDriver(swap.driver1Id);
    const driver2 = getDriver(swap.driver2Id);
    const swapPoint = getSwapPoint(swap.swapPointId);
    
    const matchesSearch = 
      driver1?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver2?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      swapPoint?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      swap.customLocation?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || swap.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const isLoading = swapsLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="swaps-loading">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="swaps-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
            Swaps
          </h1>
          <p className="text-sm text-muted-foreground">
            Track and manage driver swap meetings
          </p>
        </div>
        <AddSwapDialog />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by driver or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-swaps"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40" data-testid="select-filter-status">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredSwaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ArrowLeftRight className="h-16 w-16 text-muted-foreground/50 mb-4" />
          {swaps.length === 0 ? (
            <>
              <h3 className="text-lg font-medium mb-1">No swaps scheduled</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Schedule your first swap to get started
              </p>
              <AddSwapDialog 
                trigger={
                  <Button data-testid="button-add-first-swap">
                    Schedule First Swap
                  </Button>
                }
              />
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium mb-1">No swaps found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSwaps.map((swap) => (
            <SwapCard
              key={swap.id}
              swap={swap}
              driver1={getDriver(swap.driver1Id)}
              driver2={getDriver(swap.driver2Id)}
              swapPoint={getSwapPoint(swap.swapPointId)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
        <span>
          Showing {filteredSwaps.length} of {swaps.length} swaps
        </span>
      </div>
    </div>
  );
}
