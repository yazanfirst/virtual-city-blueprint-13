import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type FacadeTemplate = "modern_neon" | "minimal_white" | "classic_brick" | "cyber_tech" | "luxury_gold" | "urban_industrial" | "retro_vintage" | "nature_organic" | "led_display" | "pharaoh_gold" | "greek_marble" | "art_deco" | "japanese_zen" | "neon_cyberpunk";
type SignageFont = "classic" | "bold" | "elegant" | "modern" | "playful";
type TextureTemplate = "none" | "wood" | "marble" | "brick" | "metal" | "concrete" | "fabric" | "leather";

interface BrandingEditorProps {
  primaryColor: string;
  accentColor: string;
  facadeTemplate: FacadeTemplate;
  logoUrl: string;
  signageFont: SignageFont;
  textureTemplate?: TextureTemplate;
  textureUrl?: string;
  onUpdate: (updates: Partial<{
    primaryColor: string;
    accentColor: string;
    facadeTemplate: FacadeTemplate;
    logoUrl: string;
    signageFont: SignageFont;
    textureTemplate: TextureTemplate;
    textureUrl: string;
  }>) => void;
}

const facadeTemplates: { id: FacadeTemplate; name: string; description: string; icon: string }[] = [
  { id: "modern_neon", name: "Modern Neon", description: "Dark with glowing neon accents", icon: "💜" },
  { id: "minimal_white", name: "Minimal White", description: "Clean, modern, minimalist", icon: "⬜" },
  { id: "classic_brick", name: "Classic Brick", description: "Traditional storefront style", icon: "🧱" },
  { id: "cyber_tech", name: "Cyber Tech", description: "Futuristic, geometric patterns", icon: "🔮" },
  { id: "luxury_gold", name: "Luxury Gold", description: "Premium gold accents, elegant", icon: "👑" },
  { id: "urban_industrial", name: "Urban Industrial", description: "Raw, warehouse style", icon: "🏭" },
  { id: "retro_vintage", name: "Retro Vintage", description: "Classic 50s-60s aesthetic", icon: "📻" },
  { id: "nature_organic", name: "Nature Organic", description: "Green, natural, eco-friendly", icon: "🌿" },
  { id: "led_display", name: "LED Display", description: "Vibrant LED strip lighting", icon: "💡" },
  { id: "pharaoh_gold", name: "Pharaoh Gold", description: "Egyptian pyramid inspired", icon: "🏛️" },
  { id: "greek_marble", name: "Greek Marble", description: "Classical columns & marble", icon: "🏛️" },
  { id: "art_deco", name: "Art Deco", description: "1920s geometric elegance", icon: "✨" },
  { id: "japanese_zen", name: "Japanese Zen", description: "Minimalist Japanese style", icon: "⛩️" },
  { id: "neon_cyberpunk", name: "Neon Cyberpunk", description: "Heavy neon, futuristic", icon: "🌆" },
];

const signageFonts: { id: SignageFont; name: string; preview: string; fontFamily: string }[] = [
  { id: "classic", name: "Classic", preview: "Aa", fontFamily: "'Times New Roman', serif" },
  { id: "bold", name: "Bold", preview: "Aa", fontFamily: "'Impact', sans-serif" },
  { id: "elegant", name: "Elegant", preview: "Aa", fontFamily: "'Playfair Display', serif" },
  { id: "modern", name: "Modern", preview: "Aa", fontFamily: "'Orbitron', sans-serif" },
  { id: "playful", name: "Playful", preview: "Aa", fontFamily: "'Pacifico', cursive" },
];

const textureTemplates: { id: TextureTemplate; name: string; description: string; icon: string }[] = [
  { id: "none", name: "No Texture", description: "Use solid primary color", icon: "🎨" },
  { id: "wood", name: "Wood", description: "Natural wood grain pattern", icon: "🪵" },
  { id: "marble", name: "Marble", description: "Elegant marble stone", icon: "🏛️" },
  { id: "brick", name: "Brick", description: "Classic red brick wall", icon: "🧱" },
  { id: "metal", name: "Metal", description: "Industrial brushed metal", icon: "⚙️" },
  { id: "concrete", name: "Concrete", description: "Modern raw concrete", icon: "🏗️" },
  { id: "fabric", name: "Fabric", description: "Soft textile pattern", icon: "🧵" },
  { id: "leather", name: "Leather", description: "Premium leather texture", icon: "👜" },
];

const BrandingEditor = ({
  primaryColor,
  accentColor,
  facadeTemplate,
  logoUrl,
  signageFont,
  textureTemplate = "none",
  textureUrl = "",
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

  const [uploadingTexture, setUploadingTexture] = useState(false);

  const handleTextureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingTexture(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `texture-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('shop-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shop-logos')
        .getPublicUrl(fileName);

      onUpdate({ textureUrl: publicUrl, textureTemplate: 'none' });
      
      toast({
        title: "Texture uploaded!",
        description: "Your custom texture has been uploaded.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload texture",
        variant: "destructive",
      });
    } finally {
      setUploadingTexture(false);
    }
  };

  const handleRemoveTexture = () => {
    onUpdate({ textureUrl: '', textureTemplate: 'none' });
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
        
        <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
          {facadeTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onUpdate({ facadeTemplate: template.id })}
              className={`text-left p-3 rounded-lg border transition-all ${
                facadeTemplate === template.id
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{template.icon}</span>
                <span className="font-medium text-sm">{template.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Signage Font */}
      <div className="space-y-3">
        <h3 className="font-display font-bold">Signage Font Style</h3>
        
        <div className="flex flex-wrap gap-2">
          {signageFonts.map((font) => (
            <button
              key={font.id}
              onClick={() => onUpdate({ signageFont: font.id })}
              className={`px-4 py-3 rounded-lg border transition-all min-w-[100px] ${
                signageFont === font.id
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <span 
                className="block text-lg mb-1"
                style={{ fontFamily: font.fontFamily }}
              >
                {font.preview}
              </span>
              <span className="text-xs text-muted-foreground">{font.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Facade Texture */}
      <div className="space-y-3">
        <h3 className="font-display font-bold">Facade Texture</h3>
        <p className="text-sm text-muted-foreground">Choose a preset texture or upload your own</p>
        
        {/* Texture Templates */}
        <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
          {textureTemplates.map((texture) => (
            <button
              key={texture.id}
              onClick={() => onUpdate({ textureTemplate: texture.id, textureUrl: '' })}
              className={`text-left p-3 rounded-lg border transition-all ${
                textureTemplate === texture.id && !textureUrl
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{texture.icon}</span>
                <span className="font-medium text-sm">{texture.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{texture.description}</p>
            </button>
          ))}
        </div>

        {/* Custom Texture Upload */}
        <div className="pt-2 border-t border-border">
          <p className="text-sm font-medium mb-2">Or upload custom texture:</p>
          {textureUrl ? (
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg border border-border overflow-hidden bg-muted">
                <img 
                  src={textureUrl} 
                  alt="Custom texture" 
                  className="w-full h-full object-cover"
                />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRemoveTexture}
                className="text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div>
              <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {uploadingTexture ? "Uploading..." : "Upload texture image"}
                  </p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleTextureUpload}
                  disabled={uploadingTexture}
                />
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG up to 2MB. Seamless textures work best.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandingEditor;
