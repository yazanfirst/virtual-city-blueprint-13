import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  return (
    <div className="space-y-6">
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

      {/* Logo URL */}
      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL (optional)</Label>
        <Input
          id="logoUrl"
          type="url"
          value={logoUrl}
          onChange={(e) => onUpdate({ logoUrl: e.target.value })}
          placeholder="https://example.com/logo.png"
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Provide a direct link to your logo image. Square images work best.
        </p>
      </div>
    </div>
  );
};

export default BrandingEditor;
