import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, MapPin } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SwapPointCard } from "@/components/swap-point-card";
import { AddSwapPointDialog } from "@/components/add-swap-point-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SwapPoint, Swap } from "@shared/schema";

export default function SwapPoints() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: swapPoints = [], isLoading } = useQuery<SwapPoint[]>({
    queryKey: ["/api/swap-points"],
  });

  const { data: swaps = [] } = useQuery<Swap[]>({
    queryKey: ["/api/swaps"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/swap-points/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swap-points"] });
      toast({
        title: "Swap point deleted",
        description: "The swap point has been removed from the system.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete swap point. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (swapPoint: SwapPoint) => {
    if (confirm(`Are you sure you want to delete ${swapPoint.name}?`)) {
      deleteMutation.mutate(swapPoint.id);
    }
  };

  const getActiveSwapsCount = (swapPointId: string) => {
    return swaps.filter(
      s => s.swapPointId === swapPointId && 
      (s.status === "scheduled" || s.status === "in-progress")
    ).length;
  };

  const filteredSwapPoints = swapPoints.filter((point) => {
    return (
      point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="swap-points-loading">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="swap-points-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
            Swap Points
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your driver swap locations
          </p>
        </div>
        <AddSwapPointDialog />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search swap points..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-swap-points"
          />
        </div>
      </div>

      {filteredSwapPoints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MapPin className="h-16 w-16 text-muted-foreground/50 mb-4" />
          {swapPoints.length === 0 ? (
            <>
              <h3 className="text-lg font-medium mb-1">No swap points yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first swap point to get started
              </p>
              <AddSwapPointDialog 
                trigger={
                  <Button data-testid="button-add-first-swap-point">
                    Add First Swap Point
                  </Button>
                }
              />
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium mb-1">No swap points found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search criteria
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSwapPoints.map((swapPoint) => (
            <SwapPointCard 
              key={swapPoint.id} 
              swapPoint={swapPoint}
              activeSwaps={getActiveSwapsCount(swapPoint.id)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
        <span>
          Showing {filteredSwapPoints.length} of {swapPoints.length} swap points
        </span>
      </div>
    </div>
  );
}
