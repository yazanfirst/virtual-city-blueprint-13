import React, { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Info, Loader2, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useDeleteShopItem, useShopItems, useUpsertShopItem } from "@/hooks/useShopItems";
import { supabase } from "@/integrations/supabase/client";

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

const slotLabels = ["Spot 1", "Spot 2", "Spot 3", "Spot 4", "Spot 5"];

const ShopShowcaseWall: React.FC<ShowcaseWallProps> = ({ shopId, brandColor, accentColor }) => {
  const { data: items, isLoading } = useShopItems(shopId);
  const upsertItem = useUpsertShopItem(shopId);
  const deleteItem = useDeleteShopItem(shopId);
  const [slots, setSlots] = useState<SlotState[]>(() => Array.from({ length: 5 }, () => ({ ...emptySlot })));
  const [savingSlot, setSavingSlot] = useState<number | null>(null);
  const uploadRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleFileUpload = async (slotIndex: number, file: File) => {
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
    const fileName = `items/${shopId}-${slotIndex}-${Date.now()}.${fileExt}`;

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

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadedUrl = await handleFileUpload(slotIndex, file);
    if (!uploadedUrl) return;

    setSlots(prev => {
      const next = [...prev];
      next[slotIndex] = { ...next[slotIndex], image_url: uploadedUrl };
      return next;
    });
  };

  const updateSlotField = (slotIndex: number, field: keyof SlotState, value: string) => {
    setSlots(prev => {
      const next = [...prev];
      next[slotIndex] = { ...next[slotIndex], [field]: value };
      return next;
    });
  };

  const handleSave = async (slotIndex: number) => {
    const slot = slots[slotIndex];
    if (!slot.title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a short name for this item.",
        variant: "destructive",
      });
      return;
    }

    const priceValue = slot.price ? Number(slot.price) : null;
    if (slot.price && Number.isNaN(priceValue)) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid number for price.",
        variant: "destructive",
      });
      return;
    }

    setSavingSlot(slotIndex);
    try {
      await upsertItem.mutateAsync({
        id: slot.id,
        shop_id: shopId,
        slot_index: slotIndex,
        title: slot.title.trim(),
        description: slot.description?.trim() || null,
        price: priceValue,
        image_url: slot.image_url || null,
      });
      toast({
        title: "Saved",
        description: `${slot.title} is now showcased in ${slotLabels[slotIndex]}.`,
      });
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

  const handleClear = async (slotIndex: number) => {
    const existingId = items?.find(item => item.slot_index === slotIndex)?.id;
    setSavingSlot(slotIndex);
    try {
      if (existingId) {
        await deleteItem.mutateAsync(slotIndex);
      }
      setSlots(prev => {
        const next = [...prev];
        next[slotIndex] = { ...emptySlot };
        return next;
      });
      toast({
        title: "Slot cleared",
        description: `${slotLabels[slotIndex]} is now empty.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to clear slot.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingSlot(null);
    }
  };

  const slotsWithProgress = useMemo(
    () =>
      slots.map((slot, index) => ({
        ...slot,
        hasContent: Boolean(slot.title || slot.description || slot.image_url),
        index,
      })),
    [slots]
  );

  return (
    <div className="border rounded-2xl p-6 bg-card/70 space-y-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-xl font-display font-semibold text-foreground">Showcase Wall</h3>
          <p className="text-sm text-muted-foreground">
            Upload up to five hero items to display as framed art inside your virtual shop. Visitors can tap a frame to read the
            description and price.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4" />
          Images are optimized for fast loading. Keep files under 2MB.
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading showcase slots...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {slotsWithProgress.map(slot => (
            <div
              key={slot.index}
              className="rounded-xl border bg-background/80 p-4 space-y-4 shadow-sm"
              style={{ borderColor: slot.hasContent ? brandColor || accentColor : undefined }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{slotLabels[slot.index]}</p>
                  <p className="font-semibold text-foreground">{slot.title || "Add an item"}</p>
                </div>
                {slot.image_url ? (
                  <div className="h-16 w-16 rounded-lg overflow-hidden border bg-muted">
                    <img src={slot.image_url} alt={slot.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => uploadRefs.current[slot.index]?.click()}
                    title="Upload image"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={el => (uploadRefs.current[slot.index] = el)}
                  onChange={event => handleImageChange(event, slot.index)}
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor={`item-title-${slot.index}`}>Item title</Label>
                  <Input
                    id={`item-title-${slot.index}`}
                    value={slot.title}
                    placeholder="Vintage hoodie"
                    onChange={e => updateSlotField(slot.index, "title", e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`item-description-${slot.index}`}>Short description</Label>
                  <Textarea
                    id={`item-description-${slot.index}`}
                    value={slot.description}
                    placeholder="Soft cotton hoodie with limited-edition print."
                    onChange={e => updateSlotField(slot.index, "description", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`item-price-${slot.index}`}>Price (USD)</Label>
                  <Input
                    id={`item-price-${slot.index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={slot.price}
                    placeholder="49.99"
                    onChange={e => updateSlotField(slot.index, "price", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  className="w-full"
                  style={{ backgroundColor: brandColor, color: brandColor ? "#fff" : undefined }}
                  onClick={() => handleSave(slot.index)}
                  disabled={savingSlot === slot.index}
                >
                  {savingSlot === slot.index ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save to wall"
                  )}
                </Button>
                {slot.hasContent && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleClear(slot.index)}
                    disabled={savingSlot === slot.index}
                    title="Clear slot"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopShowcaseWall;
