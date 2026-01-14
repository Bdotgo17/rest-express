import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, MapPin } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Driver, SwapPoint } from "@shared/schema";

const formSchema = z.object({
  driver1Id: z.string().min(1, "First driver is required"),
  driver2Id: z.string().min(1, "Second driver is required"),
  locationType: z.enum(["existing", "custom"]),
  swapPointId: z.string().optional(),
  customLocation: z.string().optional(),
  customLatitude: z.string().optional(),
  customLongitude: z.string().optional(),
  scheduledTime: z.string().min(1, "Scheduled time is required"),
  notes: z.string().optional(),
}).refine((data) => data.driver1Id !== data.driver2Id, {
  message: "Drivers must be different",
  path: ["driver2Id"],
}).refine((data) => {
  if (data.locationType === "existing") {
    return data.swapPointId && data.swapPointId.length > 0;
  }
  return data.customLocation && data.customLocation.length > 0;
}, {
  message: "Please select a location or enter a custom location",
  path: ["customLocation"],
});

type FormData = z.infer<typeof formSchema>;

interface AddSwapDialogProps {
  trigger?: React.ReactNode;
}

export function AddSwapDialog({ trigger }: AddSwapDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const { data: swapPoints = [] } = useQuery<SwapPoint[]>({
    queryKey: ["/api/swap-points"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      driver1Id: "",
      driver2Id: "",
      locationType: "custom",
      swapPointId: "",
      customLocation: "",
      customLatitude: "",
      customLongitude: "",
      scheduledTime: new Date().toISOString().slice(0, 16),
      notes: "",
    },
  });

  const locationType = form.watch("locationType");

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        driver1Id: data.driver1Id,
        driver2Id: data.driver2Id,
        swapPointId: data.locationType === "existing" ? data.swapPointId : null,
        customLocation: data.locationType === "custom" ? data.customLocation : null,
        customLatitude: data.locationType === "custom" ? data.customLatitude : null,
        customLongitude: data.locationType === "custom" ? data.customLongitude : null,
        scheduledTime: data.scheduledTime,
        notes: data.notes,
      };
      return apiRequest("POST", "/api/swaps", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swaps"] });
      toast({
        title: "Swap scheduled",
        description: "The swap has been successfully scheduled.",
      });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule swap. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-add-swap">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Swap
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule New Swap</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="driver1Id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Driver</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-swap-driver1">
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="driver2Id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Second Driver</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-swap-driver2">
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="locationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Type</FormLabel>
                  <Tabs value={field.value} onValueChange={field.onChange}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="custom" data-testid="tab-custom-location">
                        Enter Location
                      </TabsTrigger>
                      <TabsTrigger value="existing" data-testid="tab-existing-location">
                        Existing Point
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="custom" className="space-y-4 mt-4">
                      <FormField
                        control={form.control}
                        name="customLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location Name/Address</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Highway 101, Exit 45" 
                                {...field} 
                                data-testid="input-custom-location"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="border rounded-md p-4 space-y-4 bg-muted/30">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MapPin className="h-4 w-4 text-primary" />
                          GPS Coordinates
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="customLatitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Latitude</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="33.4484" 
                                    {...field} 
                                    data-testid="input-custom-latitude"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="customLongitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Longitude</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="-112.0740" 
                                    {...field} 
                                    data-testid="input-custom-longitude"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="existing" className="mt-4">
                      <FormField
                        control={form.control}
                        name="swapPointId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Swap Point</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-swap-point">
                                  <SelectValue placeholder="Select swap point" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {swapPoints.map((point) => (
                                  <SelectItem key={point.id} value={point.id}>
                                    {point.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="scheduledTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Time</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local"
                      {...field} 
                      data-testid="input-swap-time"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any special instructions or notes..."
                      className="resize-none"
                      {...field} 
                      data-testid="input-swap-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                data-testid="button-cancel-add-swap"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                data-testid="button-submit-add-swap"
              >
                {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Schedule Swap
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
