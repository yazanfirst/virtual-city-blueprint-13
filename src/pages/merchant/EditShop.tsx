import { useState, useEffect } from "react";
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

interface ShopData {
  id: string;
  name: string;
  category: string | null;
  external_link: string | null;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  facade_template: FacadeTemplate | null;
  signage_font: string | null;
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
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    externalLink: "",
    logoUrl: "",
    primaryColor: "#3B82F6",
    accentColor: "#10B981",
    facadeTemplate: "modern_neon" as FacadeTemplate,
    signageFont: "classic" as SignageFont,
  });

  useEffect(() => {
    if (shopId && user) {
      fetchShop();
    }
  }, [shopId, user]);

  const fetchShop = async () => {
    if (!shopId) return;

    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (error) throw error;

      if (data.merchant_id !== user?.id) {
        toast({
          title: "Unauthorized",
          description: "You can only edit your own shops.",
          variant: "destructive",
        });
        navigate('/merchant/dashboard');
        return;
      }

      setOriginalData(data as ShopData);
      setFormData({
        name: data.name || "",
        category: data.category || "",
        externalLink: data.external_link || "",
        logoUrl: data.logo_url || "",
        primaryColor: data.primary_color || "#3B82F6",
        accentColor: data.accent_color || "#10B981",
        facadeTemplate: (data.facade_template as FacadeTemplate) || "modern_neon",
        signageFont: (data.signage_font as SignageFont) || "classic",
      });
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
  };

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
      formData.signageFont !== (originalData.signage_font || "classic")
    );
  };

  const handleSubmitForReview = async () => {
    if (!shopId || !hasChanges()) return;

    setSaving(true);
    try {
      // Update shop data and set status to pending_review for admin approval
      const { error } = await supabase
        .from('shops')
        .update({
          name: formData.name,
          category: formData.category || null,
          external_link: formData.externalLink || null,
          logo_url: formData.logoUrl || null,
          primary_color: formData.primaryColor,
          accent_color: formData.accentColor,
          facade_template: formData.facadeTemplate,
          signage_font: formData.signageFont,
          status: 'pending_review', // Changes require admin approval
          updated_at: new Date().toISOString(),
        })
        .eq('id', shopId);

      if (error) throw error;

      toast({
        title: "Changes Submitted!",
        description: "Your changes have been submitted for admin review. The shop will show previous data until approved.",
      });

      navigate('/merchant/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setShowConfirmDialog(false);
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
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
                />
              </div>
            </div>
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