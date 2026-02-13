import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BrandingEditor from "@/components/merchant/BrandingEditor";
import ShopPreview from "@/components/merchant/ShopPreview";
import ShopShowcaseWall from "@/components/merchant/ShopShowcaseWall";
import OfferManagement from "@/components/merchant/OfferManagement";
import { validateShopData } from "@/lib/validation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ShopFacadeTemplate = "modern_neon" | "minimal_white" | "classic_brick" | "cyber_tech" | "luxury_gold" | "urban_industrial" | "retro_vintage" | "nature_organic" | "led_display" | "pharaoh_gold" | "greek_marble" | "art_deco" | "japanese_zen" | "neon_cyberpunk";
type ShopSignageFont = "classic" | "bold" | "elegant" | "modern" | "playful";
type TextureTemplate = "none" | "wood" | "marble" | "brick" | "metal" | "concrete" | "fabric" | "leather";

interface ShopData {
  id: string;
  name: string;
  category: string | null;
  external_link: string | null;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  facade_template: ShopFacadeTemplate | null;
  signage_font: string | null;
  texture_template: string | null;
  texture_url: string | null;
  status: string | null;
}

const EditShop = () => {
  const navigate = useNavigate();
  const { shopId } = useParams<{ shopId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [originalData, setOriginalData] = useState<ShopData | null>(null);
  const storageKey = `editShop-${shopId}`;
  const [formData, setFormData] = useState(() => {
    // Restore from sessionStorage if available
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {
      name: "",
      category: "",
      externalLink: "",
      logoUrl: "",
      primaryColor: "#3B82F6",
      accentColor: "#10B981",
      facadeTemplate: "modern_neon" as ShopFacadeTemplate,
      signageFont: "classic" as ShopSignageFont,
      textureTemplate: "none" as TextureTemplate,
      textureUrl: "",
    };
  });

  /**
   * Load the shop details for editing while enforcing merchant ownership.
   */
  const fetchShop = useCallback(async () => {
    if (!shopId || !user) return;

    setLoading(true);
    try {
      // Explicitly select fields to exclude admin_notes (internal admin field)
      const { data, error } = await supabase
        .from('shops')
        .select(`
          id,
          merchant_id,
          spot_id,
          name,
          category,
          external_link,
          logo_url,
          primary_color,
          accent_color,
          facade_template,
          signage_font,
          texture_template,
          texture_url,
          status,
          duplicate_brand,
          branch_label,
          branch_justification,
          created_at,
          updated_at
        `)
        .eq('id', shopId)
        .single();

      if (error) throw error;

      if (data.merchant_id !== user.id) {
        toast({
          title: "Unauthorized",
          description: "You can only edit your own shops.",
          variant: "destructive",
        });
        navigate('/merchant/dashboard');
        return;
      }

      setOriginalData(data as ShopData);
      
      // Only set form data from DB if no sessionStorage draft exists
      const hasDraft = (() => {
        try { return !!sessionStorage.getItem(storageKey); } catch { return false; }
      })();
      
      if (!hasDraft) {
        setFormData({
          name: data.name || "",
          category: data.category || "",
          externalLink: data.external_link || "",
          logoUrl: data.logo_url || "",
          primaryColor: data.primary_color || "#3B82F6",
          accentColor: data.accent_color || "#10B981",
          facadeTemplate: (data.facade_template as ShopFacadeTemplate) || "modern_neon",
          signageFont: (data.signage_font as ShopSignageFont) || "classic",
          textureTemplate: (data.texture_template as TextureTemplate) || "none",
          textureUrl: data.texture_url || "",
        });
      }
    } catch (error) {
      console.error('Error fetching shop:', error);
      toast({
        title: "Error",
        description: "Failed to load shop data.",
        variant: "destructive",
      });
      navigate('/merchant/dashboard');
    } finally {
      setLoading(false);
    }
  }, [navigate, shopId, user]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  const hasChanges = () => {
    if (!originalData) return false;
    return (
      formData.name !== originalData.name ||
      formData.category !== (originalData.category || "") ||
      formData.externalLink !== (originalData.external_link || "") ||
      formData.logoUrl !== (originalData.logo_url || "") ||
      formData.primaryColor !== (originalData.primary_color || "#3B82F6") ||
      formData.accentColor !== (originalData.accent_color || "#10B981") ||
      formData.facadeTemplate !== (originalData.facade_template || "modern_neon") ||
      formData.signageFont !== (originalData.signage_font || "classic") ||
      formData.textureTemplate !== (originalData.texture_template || "none") ||
      formData.textureUrl !== (originalData.texture_url || "")
    );
  };

  const handleSubmitForReview = async () => {
    if (!shopId || !hasChanges()) return;

    // Validate all inputs before submission
    const validation = validateShopData({
      name: formData.name,
      category: formData.category,
      externalLink: formData.externalLink,
    });

    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      toast({
        title: "Validation Error",
        description: firstError,
        variant: "destructive",
      });
      setShowConfirmDialog(false);
      return;
    }

    setSaving(true);
    try {
      // Update shop data and set status to pending_review for admin approval
      const { error } = await supabase
        .from('shops')
        .update({
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
          status: 'pending_review', // Changes require admin approval
          updated_at: new Date().toISOString(),
        })
        .eq('id', shopId);

      if (error) throw error;

      toast({
        title: "Changes Submitted!",
        description: "Your changes have been submitted for admin review. The shop will show previous data until approved.",
      });

      clearDraft();
      navigate('/merchant/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to submit changes.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setShowConfirmDialog(false);
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => {
      const next = { ...prev, ...updates };
      try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  // Clear sessionStorage on successful save
  const clearDraft = () => {
    try { sessionStorage.removeItem(storageKey); } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/merchant/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Edit Shop
              </h1>
              <p className="text-muted-foreground">
                Update your shop details
              </p>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mb-6 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-500">Changes Require Approval</p>
            <p className="text-sm text-muted-foreground">
              Any changes you make will need to be approved by an admin before they appear in the game. 
              Your shop will temporarily show the previous data until approved.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="cyber-card space-y-8">
          {/* Basic Info */}
          <div>
            <h2 className="font-display text-xl font-bold mb-4">Shop Information</h2>
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
                <Label htmlFor="externalLink">External Link</Label>
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

          {/* Branding */}
          <div>
            <h2 className="font-display text-xl font-bold mb-4">Branding & Appearance</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <BrandingEditor
                primaryColor={formData.primaryColor}
                accentColor={formData.accentColor}
                facadeTemplate={formData.facadeTemplate}
                logoUrl={formData.logoUrl}
                signageFont={formData.signageFont}
                textureTemplate={formData.textureTemplate}
                textureUrl={formData.textureUrl}
                onUpdate={(updates) => updateFormData(updates as Partial<typeof formData>)}
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

          {shopId && (
            <div>
              <h2 className="font-display text-xl font-bold mb-4">Showcase Wall Items</h2>
              <ShopShowcaseWall
                shopId={shopId}
                brandColor={formData.primaryColor}
                accentColor={formData.accentColor}
              />
            </div>
          )}

          {shopId && (
            <div>
              <h2 className="font-display text-xl font-bold mb-4">Discount Offers</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Create offers that players can claim by spending their earned coins.
              </p>
              <OfferManagement shopId={shopId} />
            </div>
          )}
        </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-6">
          <Button variant="ghost" asChild>
            <Link to="/merchant/dashboard">
              Cancel
            </Link>
          </Button>
          
          <Button
            variant="hero"
            onClick={() => setShowConfirmDialog(true)}
            disabled={!hasChanges() || formData.name.trim().length < 2}
          >
            <Save className="mr-2 h-4 w-4" />
            Submit for Review
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Changes for Review?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes will be reviewed by an admin before they appear in the game. 
              Your shop will temporarily show the previous data until approved. 
              This usually takes 1-2 business days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitForReview} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Review"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditShop;