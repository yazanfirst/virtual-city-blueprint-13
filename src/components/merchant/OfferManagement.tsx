import { useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Edit2, Save, X, Coins, Percent, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  useMerchantShopOffers,
  useCreateOffer,
  useUpdateOffer,
  useDeleteOffer,
  MerchantOffer,
  CreateOfferInput,
} from "@/hooks/useMerchantOffers";

interface OfferManagementProps {
  shopId: string;
}

const EMPTY_FORM: Omit<CreateOfferInput, "shop_id"> = {
  title: "",
  description: "",
  discount_type: "percentage",
  discount_value: 10,
  coin_price: 50,
  min_player_level: 1,
  daily_limit: 10,
  per_player_limit: 1,
  min_order_value: null,
  expires_at: null,
};

const OfferManagement = ({ shopId }: OfferManagementProps) => {
  const { data: offers = [], isLoading } = useMerchantShopOffers(shopId);
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const deleteOffer = useDeleteOffer();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (offer: MerchantOffer) => {
    setForm({
      title: offer.title,
      description: offer.description || "",
      discount_type: offer.discount_type,
      discount_value: offer.discount_value,
      coin_price: offer.coin_price,
      min_player_level: offer.min_player_level,
      daily_limit: offer.daily_limit,
      per_player_limit: offer.per_player_limit,
      min_order_value: offer.min_order_value,
      expires_at: offer.expires_at ? offer.expires_at.split("T")[0] : null,
    });
    setEditingId(offer.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || form.discount_value <= 0 || form.coin_price <= 0) return;

    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description?.trim() || undefined,
      min_order_value: form.min_order_value || null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };

    if (editingId) {
      updateOffer.mutate({ id: editingId, shop_id: shopId, ...payload });
    } else {
      createOffer.mutate({ shop_id: shopId, ...payload });
    }
    resetForm();
  };

  const handleToggleActive = (offer: MerchantOffer) => {
    updateOffer.mutate({ id: offer.id, is_active: !offer.is_active });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteOffer.mutate({ id: deleteTarget.id, shopId });
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* Existing offers list */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading offers…</p>
      ) : offers.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground">No offers yet. Create one to let players redeem discounts.</p>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`rounded-lg border p-3 space-y-2 transition-colors ${
                offer.is_active ? "border-border bg-card" : "border-border/40 bg-muted/30 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground truncate">{offer.title}</h4>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      offer.is_active
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}>
                      {offer.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {offer.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{offer.description}</p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/30">
                  {offer.discount_type === "percentage" ? (
                    <Percent className="h-3 w-3 text-primary" />
                  ) : (
                    <Tag className="h-3 w-3 text-primary" />
                  )}
                  <span className="text-xs font-bold text-primary">
                    {offer.discount_type === "percentage"
                      ? `${offer.discount_value}%`
                      : `$${Number(offer.discount_value).toFixed(0)}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Coins className="h-3 w-3 text-yellow-500" />
                  {offer.coin_price} coins
                </span>
                <span>Lvl {offer.min_player_level}+</span>
                <span>Daily: {offer.daily_limit}</span>
                <span>Per player: {offer.per_player_limit}</span>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => startEdit(offer)}>
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleToggleActive(offer)}>
                  {offer.is_active ? (
                    <><ToggleRight className="h-3 w-3 mr-1" /> Deactivate</>
                  ) : (
                    <><ToggleLeft className="h-3 w-3 mr-1" /> Activate</>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget({ id: offer.id, title: offer.title })}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit form */}
      {showForm ? (
        <div className="rounded-lg border border-primary/30 bg-card p-4 space-y-4">
          <h4 className="font-bold text-sm">{editingId ? "Edit Offer" : "New Offer"}</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Summer Sale 15% Off"
                className="bg-muted"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Input
                value={form.description || ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional short description"
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select
                value={form.discount_type}
                onValueChange={(v) => setForm((f) => ({ ...f, discount_type: v as "percentage" | "fixed_amount" }))}
              >
                <SelectTrigger className="bg-muted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed_amount">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Discount Value *</Label>
              <Input
                type="number"
                min={1}
                max={form.discount_type === "percentage" ? 100 : 10000}
                value={form.discount_value}
                onChange={(e) => setForm((f) => ({ ...f, discount_value: Number(e.target.value) }))}
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Coin Price *</Label>
              <Input
                type="number"
                min={1}
                value={form.coin_price}
                onChange={(e) => setForm((f) => ({ ...f, coin_price: Number(e.target.value) }))}
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Min Player Level</Label>
              <Input
                type="number"
                min={1}
                value={form.min_player_level ?? 1}
                onChange={(e) => setForm((f) => ({ ...f, min_player_level: Number(e.target.value) }))}
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Daily Limit</Label>
              <Input
                type="number"
                min={1}
                value={form.daily_limit ?? 10}
                onChange={(e) => setForm((f) => ({ ...f, daily_limit: Number(e.target.value) }))}
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Per Player Limit</Label>
              <Input
                type="number"
                min={1}
                value={form.per_player_limit ?? 1}
                onChange={(e) => setForm((f) => ({ ...f, per_player_limit: Number(e.target.value) }))}
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Min Order Value ($)</Label>
              <Input
                type="number"
                min={0}
                value={form.min_order_value ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    min_order_value: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                placeholder="Optional"
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={form.expires_at || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expires_at: e.target.value || null }))
                }
                className="bg-muted"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSubmit} disabled={!form.title.trim() || form.discount_value <= 0 || form.coin_price <= 0}>
              <Save className="h-4 w-4 mr-1" />
              {editingId ? "Save Changes" : "Create Offer"}
            </Button>
            <Button variant="ghost" onClick={resetForm}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Offer
        </Button>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.title}". Players who already claimed it keep their codes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OfferManagement;
