import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Loader2, MapPin, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

async function geocodeAddress(address: string): Promise<{ lat: string; lon: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SwapTrack/1.0' }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: data[0].lat, lon: data[0].lon };
    }
    return null;
  } catch {
    return null;
  }
}

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  truckId: z.string().min(1, "Truck ID is required"),
  status: z.enum(["available", "en-route", "waiting", "delayed", "offline"]),
  currentLocation: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddDriverDialogProps {
  trigger?: React.ReactNode;
}

export function AddDriverDialog({ trigger }: AddDriverDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      truckId: "",
      status: "available",
      currentLocation: "",
      latitude: "",
      longitude: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/drivers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({
        title: "Driver added",
        description: "The driver has been successfully added.",
      });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add driver. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    let submitData = { ...data };
    
    if ((!data.latitude || !data.longitude) && data.currentLocation) {
      setIsLookingUp(true);
      const coords = await geocodeAddress(data.currentLocation);
      setIsLookingUp(false);
      
      if (coords) {
        submitData.latitude = coords.lat;
        submitData.longitude = coords.lon;
        form.setValue("latitude", coords.lat);
        form.setValue("longitude", coords.lon);
      }
    }
    
    mutation.mutate(submitData);
  };

  const handleLookupLocation = async () => {
    const location = form.getValues("currentLocation");
    if (!location || location.length < 3) {
      toast({
        title: "Enter a location",
        description: "Please enter a location first to look up coordinates.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLookingUp(true);
    const coords = await geocodeAddress(location);
    setIsLookingUp(false);
    
    if (coords) {
      form.setValue("latitude", coords.lat);
      form.setValue("longitude", coords.lon);
      toast({
        title: "Coordinates found",
        description: "GPS coordinates have been filled in automatically.",
      });
    } else {
      toast({
        title: "Location not found",
        description: "Could not find coordinates for this location. Please enter them manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-add-driver">
            <Plus className="h-4 w-4 mr-2" />
            Add Driver
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Driver</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John Smith" 
                      {...field} 
                      data-testid="input-driver-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="+1 555-123-4567" 
                      {...field} 
                      data-testid="input-driver-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="truckId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Truck ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="TRK-001" 
                      {...field} 
                      data-testid="input-driver-truck-id"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-driver-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="en-route">En Route</SelectItem>
                      <SelectItem value="waiting">Waiting</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="currentLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Location (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Highway 101, Exit 45" 
                      {...field} 
                      data-testid="input-driver-location"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="border rounded-md p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-primary" />
                  GPS Coordinates
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLookupLocation}
                  disabled={isLookingUp}
                  data-testid="button-lookup-location"
                >
                  {isLookingUp ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Lookup from Location
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="33.4484" 
                          {...field} 
                          data-testid="input-driver-latitude"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="-112.0740" 
                          {...field} 
                          data-testid="input-driver-longitude"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                data-testid="button-cancel-add-driver"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                data-testid="button-submit-add-driver"
              >
                {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Driver
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
