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
import { Plus, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Driver, SwapPoint } from "@shared/schema";

const formSchema = z.object({
  driver1Id: z.string().min(1, "First driver is required"),
  driver2Id: z.string().min(1, "Second driver is required"),
  swapPointId: z.string().min(1, "Swap point is required"),
  scheduledTime: z.string().min(1, "Scheduled time is required"),
  status: z.enum(["scheduled", "in-progress", "completed", "cancelled"]),
  notes: z.string().optional(),
}).refine((data) => data.driver1Id !== data.driver2Id, {
  message: "Drivers must be different",
  path: ["driver2Id"],
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
      swapPointId: "",
      scheduledTime: new Date().toISOString().slice(0, 16),
      status: "scheduled",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/swaps", data);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule New Swap</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="driver1Id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Driver</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-swap-driver1">
                        <SelectValue placeholder="Select first driver" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name} ({driver.truckId})
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
                        <SelectValue placeholder="Select second driver" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name} ({driver.truckId})
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
              name="swapPointId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Swap Point</FormLabel>
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
