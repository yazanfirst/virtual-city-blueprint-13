import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import CityMap from "./pages/CityMap";
import StreetView from "./pages/StreetView";
import MerchantLogin from "./pages/merchant/MerchantLogin";
import MerchantDashboard from "./pages/merchant/MerchantDashboard";
import MerchantStreets from "./pages/merchant/MerchantStreets";
import MerchantShops from "./pages/merchant/MerchantShops";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/city-map" element={<CityMap />} />
          <Route path="/city/:streetId" element={<StreetView />} />
          <Route path="/merchant/login" element={<MerchantLogin />} />
          <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
          <Route path="/merchant/streets" element={<MerchantStreets />} />
          <Route path="/merchant/shops/:streetId" element={<MerchantShops />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
