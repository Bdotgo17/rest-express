import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Fuel, ParkingCircle, Coffee } from "lucide-react";
import type { SwapPoint } from "@shared/schema";

interface SwapPointCardProps {
  swapPoint: SwapPoint;
  activeSwaps?: number;
}

const amenityIcons: Record<string, React.ReactNode> = {
  parking: <ParkingCircle className="h-4 w-4" />,
  fuel: <Fuel className="h-4 w-4" />,
  rest: <Coffee className="h-4 w-4" />,
};

export function SwapPointCard({ swapPoint, activeSwaps = 0 }: SwapPointCardProps) {
  const capacityPercentage = (activeSwaps / swapPoint.capacity) * 100;
  const capacityColor = capacityPercentage >= 80 
    ? "bg-red-500" 
    : capacityPercentage >= 50 
      ? "bg-yellow-500" 
      : "bg-green-500";

  return (
    <Card className="hover-elevate" data-testid={`card-swap-point-${swapPoint.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold" data-testid={`text-swap-point-name-${swapPoint.id}`}>
            {swapPoint.name}
          </CardTitle>
          <Badge variant="secondary" className="shrink-0">
            <Users className="h-3 w-3 mr-1" />
            {activeSwaps}/{swapPoint.capacity}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{swapPoint.address}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Capacity</span>
            <span className="font-medium">{activeSwaps} of {swapPoint.capacity}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${capacityColor} transition-all duration-300`}
              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
            />
          </div>
        </div>
        
        {swapPoint.amenities && swapPoint.amenities.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {swapPoint.amenities.map((amenity) => (
              <Badge 
                key={amenity} 
                variant="outline" 
                className="text-xs gap-1"
              >
                {amenityIcons[amenity] || null}
                {amenity}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
