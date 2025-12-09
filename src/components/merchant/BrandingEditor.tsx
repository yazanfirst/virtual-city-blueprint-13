import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type FacadeTemplate = "modern_neon" | "minimal_white" | "classic_brick" | "cyber_tech";

interface BrandingEditorProps {
  primaryColor: string;
  accentColor: string;
  facadeTemplate: FacadeTemplate;
  logoUrl: string;
  onUpdate: (updates: Partial<{
    primaryColor: string;
    accentColor: string;
    facadeTemplate: FacadeTemplate;
    logoUrl: string;
  }>) => void;
}

const facadeTemplates: { id: FacadeTemplate; name: string; description: string }[] = [
  { id: "modern_neon", name: "Modern Neon", description: "Dark with glowing neon accents" },
  { id: "minimal_white", name: "Minimal White", description: "Clean, modern, minimalist" },
  { id: "classic_brick", name: "Classic Brick", description: "Traditional storefront style" },
  { id: "cyber_tech", name: "Cyber Tech", description: "Futuristic, geometric patterns" },
];

const BrandingEditor = ({
  primaryColor,
  accentColor,
  facadeTemplate,
  logoUrl,
  onUpdate,
}: BrandingEditorProps) => {
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('shop-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('shop-logos')
        .getPublicUrl(fileName);

      onUpdate({ logoUrl: publicUrl });
      
      toast({
        title: "Logo uploaded!",
        description: "Your logo has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    onUpdate({ logoUrl: '' });
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <div className="space-y-3">
        <h3 className="font-display font-bold">Shop Logo</h3>
        
        {logoUrl ? (
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg border border-border overflow-hidden bg-muted">
              <img 
                src={logoUrl} 
                alt="Shop logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRemoveLogo}
              className="text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
              <div className="flex flex-col items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <p className="text-sm text-muted-foreground">
                  {uploading ? "Uploading..." : "Click to upload logo"}
                </p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG up to 2MB. Square images work best.
            </p>
          </div>
        )}
      </div>

      {/* Colors */}
      <div className="space-y-4">
        <h3 className="font-display font-bold">Colors</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <div 
                className="w-10 h-10 rounded border border-border cursor-pointer" 
                style={{ backgroundColor: primaryColor }}
              />
              <Input
                id="primaryColor"
                type="color"
                value={primaryColor}
                onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                className="w-full h-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent Color</Label>
            <div className="flex gap-2">
              <div 
                className="w-10 h-10 rounded border border-border cursor-pointer" 
                style={{ backgroundColor: accentColor }}
              />
              <Input
                id="accentColor"
                type="color"
                value={accentColor}
                onChange={(e) => onUpdate({ accentColor: e.target.value })}
                className="w-full h-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Facade Template */}
      <div className="space-y-3">
        <h3 className="font-display font-bold">Facade Style</h3>
        
        <div className="grid grid-cols-2 gap-2">
          {facadeTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onUpdate({ facadeTemplate: template.id })}
              className={`text-left p-3 rounded-lg border transition-all ${
                facadeTemplate === template.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <span className="font-medium text-sm">{template.name}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandingEditor;
