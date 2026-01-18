import React, { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Package, DollarSign, FileText, Sparkles, Check, X, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useDeleteShopItem, useShopItems, useUpsertShopItem } from "@/hooks/useShopItems";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { validateShopItemData } from "@/lib/validation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShowcaseWallProps {
  shopId: string;
  brandColor?: string;
  accentColor?: string;
}

interface SlotState {
  id?: string;
  title: string;
  description: string;
  price: string;
  image_url?: string;
}

const emptySlot: SlotState = {
  title: "",
  description: "",
  price: "",
  image_url: "",
};

const ShopShowcaseWall: React.FC<ShowcaseWallProps> = ({ shopId, brandColor = "#3B82F6", accentColor = "#10B981" }) => {
  const { data: items, isLoading } = useShopItems(shopId);
  const upsertItem = useUpsertShopItem(shopId);
  const deleteItem = useDeleteShopItem(shopId);
  const [slots, setSlots] = useState<SlotState[]>(() => Array.from({ length: 5 }, () => ({ ...emptySlot })));
  const [savingSlot, setSavingSlot] = useState<number | null>(null);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<SlotState>({ ...emptySlot });
  const uploadRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get user ID for storage path
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (!items) return;
    const next = Array(5)
      .fill(null)
      .map((_, index) => {
        const match = items.find(item => item.slot_index === index);
        return match
          ? {
              id: match.id,
              title: match.title,
              description: match.description || "",
              price: match.price?.toString() || "",
              image_url: match.image_url || "",
            }
          : { ...emptySlot };
      });
    setSlots(next);
  }, [items]);

  const handleFileUpload = async (file: File) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload images.",
        variant: "destructive",
      });
      return null;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return null;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return null;
    }

    const fileExt = file.name.split(".").pop();
    // Use user-specific path for storage security
    const fileName = `${userId}/items/${shopId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("shop-logos").upload(fileName, file);
    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive",
      });
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("shop-logos").getPublicUrl(fileName);

    return publicUrl;
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadedUrl = await handleFileUpload(file);
    if (!uploadedUrl) return;

    setEditForm(prev => ({ ...prev, image_url: uploadedUrl }));
  };

  const openEditDialog = (slotIndex: number) => {
    setEditingSlot(slotIndex);
    setEditForm({ ...slots[slotIndex] });
  };

  const closeEditDialog = () => {
    setEditingSlot(null);
    setEditForm({ ...emptySlot });
  };

  const handleSave = async () => {
    if (editingSlot === null) return;
    
    const priceValue = editForm.price ? Number(editForm.price) : null;
    
    // Validate using Zod schema
    const validation = validateShopItemData({
      title: editForm.title,
      description: editForm.description,
      price: priceValue,
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

    setSavingSlot(editingSlot);
    try {
      await upsertItem.mutateAsync({
        id: editForm.id,
        shop_id: shopId,
        slot_index: editingSlot,
        title: editForm.title.trim(),
        description: editForm.description?.trim() || null,
        price: priceValue,
        image_url: editForm.image_url || null,
      });
      toast({
        title: "Item saved!",
        description: `${editForm.title} is now displayed on your showcase wall.`,
      });
      closeEditDialog();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save item.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingSlot(null);
    }
  };

  const handleDelete = async (slotIndex: number) => {
    setSavingSlot(slotIndex);
    try {
      await deleteItem.mutateAsync(slotIndex);
      setSlots(prev => {
        const next = [...prev];
        next[slotIndex] = { ...emptySlot };
        return next;
      });
      toast({
        title: "Item removed",
        description: "The showcase frame is now empty.",
      });
      closeEditDialog();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to remove item.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingSlot(null);
    }
  };

  const filledCount = useMemo(() => slots.filter(s => s.title).length, [slots]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div 
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${brandColor}20` }}
            >
              <Sparkles className="h-5 w-5" style={{ color: brandColor }} />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-foreground">Showcase Wall</h3>
              <p className="text-sm text-muted-foreground">
                Display up to 5 products in your virtual shop
              </p>
            </div>
          </div>
        </div>
        <div 
          className="px-3 py-1.5 rounded-full text-sm font-medium"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {filledCount}/5 slots used
        </div>
      </div>

      {/* Wall Preview Grid */}
      <div className="relative">
        {/* Decorative wall background */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-50"
          style={{ 
            background: `linear-gradient(135deg, ${brandColor}10, ${accentColor}10)`,
          }}
        />
        
        <div className="relative grid grid-cols-5 gap-3 p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
          {slots.map((slot, index) => {
            const hasContent = Boolean(slot.title);
            const isSaving = savingSlot === index;
            
            return (
              <button
                key={index}
                onClick={() => openEditDialog(index)}
                disabled={isSaving}
                className={cn(
                  "group relative aspect-[3/4] rounded-xl border-2 border-dashed transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50",
                  hasContent 
                    ? "border-transparent bg-background shadow-md" 
                    : "border-muted-foreground/30 hover:border-primary/50 bg-muted/30"
                )}
              >
                {isSaving && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl z-10">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
                
                {hasContent ? (
                  <div className="absolute inset-0 flex flex-col overflow-hidden rounded-xl">
                    {/* Image */}
                    <div className="relative flex-1 overflow-hidden">
                      {slot.image_url ? (
                        <img 
                          src={slot.image_url} 
                          alt={slot.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div 
                          className="h-full w-full flex items-center justify-center"
                          style={{ backgroundColor: `${brandColor}15` }}
                        >
                          <Package className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Edit3 className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="p-2 bg-background border-t border-border/50">
                      <p className="text-xs font-medium text-foreground truncate">{slot.title}</p>
                      {slot.price && (
                        <p className="text-xs font-bold" style={{ color: accentColor }}>
                          ${parseFloat(slot.price).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
                    <div 
                      className="h-10 w-10 rounded-full flex items-center justify-center transition-colors"
                      style={{ backgroundColor: `${brandColor}10` }}
                    >
                      <ImagePlus className="h-5 w-5" style={{ color: brandColor }} />
                    </div>
                    <span className="text-xs text-muted-foreground text-center">
                      Frame {index + 1}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
        <Package className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Pro tips for showcase items:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use high-quality product photos with good lighting</li>
            <li>Keep descriptions short and compelling (max 2-3 lines)</li>
            <li>Feature your best-sellers or newest arrivals</li>
          </ul>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingSlot !== null} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div 
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${brandColor}20` }}
              >
                <Package className="h-4 w-4" style={{ color: brandColor }} />
              </div>
              {editForm.id ? "Edit Product" : "Add Product"} - Frame {(editingSlot ?? 0) + 1}
            </DialogTitle>
            <DialogDescription>
              This item will be displayed in a beautiful frame on your shop wall for visitors to see.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Image Upload */}
            <div className="space-y-3">
              <Label>Product Image</Label>
              <div className="flex items-start gap-4">
                <div 
                  className={cn(
                    "relative h-32 w-32 rounded-xl border-2 border-dashed overflow-hidden shrink-0 transition-colors",
                    editForm.image_url ? "border-transparent" : "border-muted-foreground/30"
                  )}
                >
                  {editForm.image_url ? (
                    <>
                      <img 
                        src={editForm.image_url} 
                        alt="Product preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setEditForm(prev => ({ ...prev, image_url: "" }))}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => uploadRefs.current[editingSlot ?? 0]?.click()}
                      className="h-full w-full flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
                    >
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload</span>
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Upload a clear product photo. Square images work best.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max file size: 2MB • PNG, JPG, WEBP
                  </p>
                  {!editForm.image_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => uploadRefs.current[editingSlot ?? 0]?.click()}
                    >
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Choose Image
                    </Button>
                  )}
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={el => (uploadRefs.current[editingSlot ?? 0] = el)}
                onChange={handleImageChange}
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="item-title" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Product Name *
              </Label>
              <Input
                id="item-title"
                value={editForm.title}
                onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Premium Cotton Hoodie"
                className="bg-muted/50"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="item-description" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Description
              </Label>
              <Textarea
                id="item-description"
                value={editForm.description}
                onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Soft, comfortable hoodie made from 100% organic cotton..."
                rows={3}
                className="bg-muted/50 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Keep it short - this appears when visitors tap the frame.
              </p>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="item-price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Price (USD)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="item-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={e => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="49.99"
                  className="bg-muted/50 pl-7"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div>
              {editForm.id && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => editingSlot !== null && handleDelete(editingSlot)}
                  disabled={savingSlot !== null}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeEditDialog}
                disabled={savingSlot !== null}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={savingSlot !== null || !editForm.title.trim()}
                style={{ backgroundColor: brandColor }}
              >
                {savingSlot !== null ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Save Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopShowcaseWall;
