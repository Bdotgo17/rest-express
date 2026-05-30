import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import DriverApp from "@/pages/driver-mobile";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DriverApp />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
