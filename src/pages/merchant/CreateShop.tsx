import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, MapPin, Store, Palette, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useStreets, useSpotsWithShops } from "@/hooks/useStreets";
import { useCreateShop } from "@/hooks/useMerchantShops";
import SpotSelectionMap from "@/components/merchant/SpotSelectionMap";
import BrandingEditor from "@/components/merchant/BrandingEditor";
import ShopPreview from "@/components/merchant/ShopPreview";
import { validateShopData } from "@/lib/validation";

type FacadeTemplate = "modern_neon" | "minimal_white" | "classic_brick" | "cyber_tech" | "luxury_gold" | "urban_industrial" | "retro_vintage" | "nature_organic" | "led_display" | "pharaoh_gold" | "greek_marble" | "art_deco" | "japanese_zen" | "neon_cyberpunk";
type SignageFont = "classic" | "bold" | "elegant" | "modern" | "playful";
type TextureTemplate = "none" | "wood" | "marble" | "brick" | "metal" | "concrete" | "fabric" | "leather";

interface ShopFormData {
  streetId: string;
  spotId: string;
  name: string;
  category: string;
  externalLink: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  facadeTemplate: FacadeTemplate;
  signageFont: SignageFont;
  textureTemplate: TextureTemplate;
  textureUrl: string;
  duplicateBrand: boolean;
  branchLabel: string;
  branchJustification: string;
}

const initialFormData: ShopFormData = {
  streetId: "",
  spotId: "",
  name: "",
  category: "",
  externalLink: "",
  logoUrl: "",
  primaryColor: "#3B82F6",
  accentColor: "#10B981",
  facadeTemplate: "modern_neon",
  signageFont: "classic",
  textureTemplate: "none",
  textureUrl: "",
  duplicateBrand: false,
  branchLabel: "",
  branchJustification: "",
};

const steps = [
  { id: 1, name: "Choose Street", icon: MapPin },
  { id: 2, name: "Select Spot", icon: Store },
  { id: 3, name: "Shop Info", icon: FileCheck },
  { id: 4, name: "Branding", icon: Palette },
  { id: 5, name: "Review", icon: Check },
];

const CreateShop = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ShopFormData>(initialFormData);
  
  const { data: streets, isLoading: streetsLoading } = useStreets();
  const { data: spotsWithShops, isLoading: spotsLoading } = useSpotsWithShops(formData.streetId);
  const createShop = useCreateShop();

  // Pre-select spot from URL params (coming from 3D game)
  useEffect(() => {
    const spotId = searchParams.get('spotId');
    const streetId = searchParams.get('streetId');
    
    if (spotId && streetId) {
      setFormData(prev => ({ ...prev, streetId, spotId }));
      setCurrentStep(3); // Skip to Shop Info step
    }
  }, [searchParams]);

  const selectedStreet = streets?.find(s => s.id === formData.streetId);
  const selectedSpot = spotsWithShops?.find(s => s.id === formData.spotId);

  const updateFormData = (updates: Partial<ShopFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!formData.streetId;
      case 2: return !!formData.spotId;
      case 3: {
        const validation = validateShopData({
          name: formData.name,
          category: formData.category,
          externalLink: formData.externalLink,
          branchJustification: formData.branchJustification,
        });
        return validation.valid;
      }
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    // Validate all inputs before submission
    const validation = validateShopData({
      name: formData.name,
      category: formData.category,
      externalLink: formData.externalLink,
      branchJustification: formData.branchJustification,
    });

    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      toast({
        title: "Validation Error",
        description: firstError,
        variant: "destructive",
      });
      return;
    }

    try {
      await createShop.mutateAsync({
        spot_id: formData.spotId,
        name: formData.name.trim(),
        category: formData.category?.trim() || null,
        external_link: formData.externalLink?.trim() || null,
        logo_url: formData.logoUrl || null,
        primary_color: formData.primaryColor,
        accent_color: formData.accentColor,
        facade_template: formData.facadeTemplate,
        signage_font: formData.signageFont,
        texture_template: formData.textureTemplate !== 'none' ? formData.textureTemplate : null,
        texture_url: formData.textureUrl || null,
        duplicate_brand: formData.duplicateBrand,
        branch_label: formData.branchLabel?.trim() || null,
        branch_justification: formData.branchJustification?.trim() || null,
      });

      toast({
        title: "Shop Created!",
        description: "Your shop has been submitted for review. You'll be notified once it's approved.",
      });

      navigate("/merchant/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create shop. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-12 px-3 sm:px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/merchant/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Create New Shop
            </h1>
            <p className="text-muted-foreground">
              Set up your virtual storefront
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center shrink-0">
                <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all ${
                  currentStep >= step.id
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}>
                  <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className={`hidden md:block ml-2 text-sm font-medium ${
                  currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                }`}>
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-6 sm:w-12 md:w-24 h-0.5 mx-1 sm:mx-2 ${
                    currentStep > step.id ? "bg-primary" : "bg-border"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="cyber-card min-h-[400px]">
          {/* Step 1: Choose Street */}
          {currentStep === 1 && (
            <div>
              <h2 className="font-display text-xl font-bold mb-4">Choose a Street</h2>
              <p className="text-muted-foreground mb-6">
                Select the street where you want to open your shop
              </p>
              
              {streetsLoading ? (
                <div className="animate-pulse text-center py-8">Loading streets...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {streets?.filter(s => s.is_active).map(street => (
                    <button
                      key={street.id}
                      onClick={() => updateFormData({ streetId: street.id, spotId: "" })}
                      className={`text-left p-4 rounded-lg border transition-all ${
                        formData.streetId === street.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <h3 className="font-display font-bold text-foreground">{street.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{street.description}</p>
                      <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-muted text-muted-foreground uppercase">
                        {street.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Spot */}
          {currentStep === 2 && (
            <div>
              <h2 className="font-display text-xl font-bold mb-4">Select Shop Location</h2>
              <p className="text-muted-foreground mb-6">
                Choose an available spot on {selectedStreet?.name}
              </p>
              
              {spotsLoading ? (
                <div className="animate-pulse text-center py-8">Loading spots...</div>
              ) : (
                <SpotSelectionMap
                  spots={spotsWithShops || []}
                  selectedSpotId={formData.spotId}
                  onSelectSpot={(spotId) => updateFormData({ spotId })}
                />
              )}
            </div>
          )}

          {/* Step 3: Shop Info */}
          {currentStep === 3 && (
            <div>
              <h2 className="font-display text-xl font-bold mb-4">Shop Information</h2>
              <p className="text-muted-foreground mb-6">
                Tell us about your shop
              </p>
              
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="name">Shop Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    placeholder="My Awesome Shop"
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => updateFormData({ category: e.target.value })}
                    placeholder="e.g., Clothing, Electronics, etc."
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="externalLink">External Link (Website/Instagram)</Label>
                  <Input
                    id="externalLink"
                    value={formData.externalLink}
                    onChange={(e) => updateFormData({ externalLink: e.target.value })}
                    placeholder="https://..."
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Branding */}
          {currentStep === 4 && (
            <div>
              <h2 className="font-display text-xl font-bold mb-4">Branding & Appearance</h2>
              <p className="text-muted-foreground mb-6">
                Customize how your shop looks in the virtual city
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <BrandingEditor
                  primaryColor={formData.primaryColor}
                  accentColor={formData.accentColor}
                  facadeTemplate={formData.facadeTemplate}
                  logoUrl={formData.logoUrl}
                  signageFont={formData.signageFont}
                  textureTemplate={formData.textureTemplate}
                  textureUrl={formData.textureUrl}
                  onUpdate={(updates) => updateFormData(updates as Partial<ShopFormData>)}
                />
                
                <div>
                  <h3 className="font-display font-bold mb-3">Preview</h3>
                  <ShopPreview
                    name={formData.name}
                    primaryColor={formData.primaryColor}
                    accentColor={formData.accentColor}
                    facadeTemplate={formData.facadeTemplate}
                    logoUrl={formData.logoUrl}
                    signageFont={formData.signageFont}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div>
              <h2 className="font-display text-xl font-bold mb-4">Review & Submit</h2>
              <p className="text-muted-foreground mb-6">
                Confirm your shop details before submitting
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Location</h4>
                    <p className="font-medium">{selectedStreet?.name}</p>
                    <p className="text-sm text-muted-foreground">Spot {selectedSpot?.spot_label}</p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Shop Details</h4>
                    <p className="font-medium">{formData.name}</p>
                    {formData.category && <p className="text-sm text-muted-foreground">{formData.category}</p>}
                    {formData.externalLink && (
                      <a href={formData.externalLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        {formData.externalLink}
                      </a>
                    )}
                  </div>
                  
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Style</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: formData.primaryColor }} />
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: formData.accentColor }} />
                      <span className="text-sm capitalize">{formData.facadeTemplate.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <ShopPreview
                    name={formData.name}
                    primaryColor={formData.primaryColor}
                    accentColor={formData.accentColor}
                    facadeTemplate={formData.facadeTemplate}
                    logoUrl={formData.logoUrl}
                    signageFont={formData.signageFont}
                  />
                </div>
              </div>
              
              <div className="mt-6 p-4 rounded-lg border border-primary/30 bg-primary/5">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Note:</strong> Your shop will be reviewed by our team before it appears in the virtual city. 
                  This usually takes 1-2 business days.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          {currentStep < 5 ? (
            <Button
              variant="cyber"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="hero"
              onClick={handleSubmit}
              disabled={createShop.isPending}
            >
              {createShop.isPending ? "Creating..." : "Submit for Review"}
              <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateShop;
