import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CityMap from "./pages/CityMap";
import StreetView from "./pages/StreetView";
import Settings from "./pages/Settings";
import MerchantDashboard from "./pages/merchant/MerchantDashboard";
import MerchantStreets from "./pages/merchant/MerchantStreets";
import MerchantShops from "./pages/merchant/MerchantShops";
import CreateShop from "./pages/merchant/CreateShop";
import EditShop from "./pages/merchant/EditShop";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";
import Marketing from "./pages/Marketing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/city-map" element={<CityMap />} />
            <Route path="/city/:streetId" element={<StreetView />} />
            
            {/* Settings - requires auth */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            {/* Merchant routes */}
            <Route 
              path="/merchant/dashboard" 
              element={
                <ProtectedRoute requireMerchant>
                  <MerchantDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/merchant/streets" 
              element={
                <ProtectedRoute requireMerchant>
                  <MerchantStreets />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/merchant/shops/:streetId" 
              element={
                <ProtectedRoute requireMerchant>
                  <MerchantShops />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/merchant/create-shop" 
              element={
                <ProtectedRoute requireMerchant>
                  <CreateShop />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/merchant/edit-shop/:shopId" 
              element={
                <ProtectedRoute requireMerchant>
                  <EditShop />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
