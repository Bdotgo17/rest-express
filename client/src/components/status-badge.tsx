import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Pause, Truck, AlertTriangle, Calendar, XCircle, Loader2 } from "lucide-react";
import type { DriverStatus, SwapStatus } from "@shared/schema";

interface StatusBadgeProps {
  status: DriverStatus | SwapStatus;
  type?: "driver" | "swap";
}

const driverStatusConfig: Record<DriverStatus, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  available: {
    label: "Available",
    icon: <CheckCircle className="h-3 w-3" />,
    variant: "secondary",
  },
  "en-route": {
    label: "En Route",
    icon: <Truck className="h-3 w-3" />,
    variant: "default",
  },
  waiting: {
    label: "Waiting",
    icon: <Pause className="h-3 w-3" />,
    variant: "outline",
  },
  delayed: {
    label: "Delayed",
    icon: <AlertTriangle className="h-3 w-3" />,
    variant: "destructive",
  },
  offline: {
    label: "Offline",
    icon: <Clock className="h-3 w-3" />,
    variant: "secondary",
  },
};

const swapStatusConfig: Record<SwapStatus, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  scheduled: {
    label: "Scheduled",
    icon: <Calendar className="h-3 w-3" />,
    variant: "outline",
  },
  "in-progress": {
    label: "In Progress",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    variant: "default",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle className="h-3 w-3" />,
    variant: "secondary",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className="h-3 w-3" />,
    variant: "destructive",
  },
};

export function StatusBadge({ status, type = "driver" }: StatusBadgeProps) {
  const config = type === "driver" 
    ? driverStatusConfig[status as DriverStatus] 
    : swapStatusConfig[status as SwapStatus];

  if (!config) return null;

  return (
    <Badge 
      variant={config.variant}
      className="gap-1 font-medium text-xs"
      data-testid={`badge-status-${status}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}
