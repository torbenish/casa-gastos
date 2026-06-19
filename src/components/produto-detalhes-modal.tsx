"use client";

import {
  Calendar,
  MapPin,
  Package,
  Receipt,
  Scale,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase";

// ─── Types ──────────────────────────────────────────────────────────────────

type PurchaseHistoryItem = {
  id: string;
  expenseId: string;
  description: string;
  date: string;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  weight: number | null;
  price_per_kg: number | null;
  measurement_type: "unit" | "weight" | null;
  placeName: string | null;
};

type ProductDetails = {
  id: string;
  name: string;
  category: string | null;
  history: PurchaseHistoryItem[];
};

type Props = {
  productId: string | null;
  open: boolean;
  onClose: () => void;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrencyBRL(value: number | null) {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getItemTotal(item: PurchaseHistoryItem) {
  if (item.measurement_type === "weight") {
    return ((item.weight ?? 0) / 1000) * (item.price_per_kg ?? 0);
  }
  return Number(item.total_price ?? 0);
}

export function ProdutoDetalhesModal({ productId, open, onClose }: Props) {
  const [details, setDetails] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!productId || !open) return;

    async function load() {
      setLoading(true);
      setDetails(null);

      const { data: product } = await supabase
        .from("products")
        .select("id, name, category")
        .eq("id", productId)
        .single();

      if (!product) {
        setLoading(false);
        return;
      }

      const { data: itemsData } = await supabase
        .from("expense_items")
        .select(
          `id, expense_id, quantity, unit_price, total_price, weight, price_per_kg, measurement_type,
          expenses:expense_id(id, description, date, place:place_id(name))`,
        )
        .eq("product_id", productId);

      const history: PurchaseHistoryItem[] = (itemsData ?? [])
        .map((raw) => {
          const expense = Array.isArray(raw.expenses)
            ? raw.expenses[0]
            : raw.expenses;

          const place = expense?.place
            ? Array.isArray(expense.place)
              ? expense.place[0]
              : expense.place
            : null;

          return {
            id: raw.id as string,
            expenseId: raw.expense_id as string,
            description: expense?.description ?? "Gasto sem descrição",
            date: expense?.date ?? "",
            quantity: raw.quantity as number | null,
            unit_price: raw.unit_price as number | null,
            total_price: raw.total_price as number | null,
            weight: raw.weight as number | null,
            price_per_kg: raw.price_per_kg as number | null,
            measurement_type:
              (raw.measurement_type as "unit" | "weight" | null) ?? null,
            placeName: place?.name ?? null,
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date));

      setDetails({
        id: product.id,
        name: product.name,
        category: product.category,
        history,
      });

      setLoading(false);
    }

    load();
  }, [productId, open, supabase]);

  const purchaseCount = details?.history.length ?? 0;
  const totalSpent =
    details?.history.reduce((acc, item) => acc + getItemTotal(item), 0) ?? 0;
  const avgPrice = purchaseCount > 0 ? totalSpent / purchaseCount : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-4 h-4 text-violet-600" />
            Detalhes do produto
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-10 text-muted-foreground text-sm">
            Carregando...
          </div>
        )}

        {!loading && details && (
          <div className="space-y-5 pt-1">
            {/* Cabeçalho */}
            <div className="space-y-1">
              <p className="text-lg font-semibold">{details.name}</p>
              {details.category && (
                <Badge variant="outline">{details.category}</Badge>
              )}
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-violet-50 dark:bg-violet-950 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Total gasto
                </p>
                <p className="text-xl font-bold text-violet-600">
                  {formatCurrencyBRL(totalSpent)}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Preço médio
                </p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrencyBRL(avgPrice)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              Comprado {purchaseCount} {purchaseCount === 1 ? "vez" : "vezes"}
            </div>

            {/* Histórico */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Histórico de compras</p>

              {details.history.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma compra registrada ainda.
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden divide-y">
                  {details.history.map((item) => {
                    const isWeight = item.measurement_type === "weight";
                    const itemTotal = getItemTotal(item);

                    return (
                      <div key={item.id} className="px-3 py-3 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Receipt className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {item.description}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-violet-600 shrink-0">
                            {formatCurrencyBRL(itemTotal)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pl-5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.date
                              ? new Date(
                                  `${item.date}T00:00:00`,
                                ).toLocaleDateString("pt-BR")
                              : "—"}
                          </span>

                          {item.placeName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.placeName}
                            </span>
                          )}

                          {isWeight ? (
                            <span className="flex items-center gap-1">
                              <Scale className="w-3 h-3" />
                              {item.weight != null
                                ? item.weight >= 1000
                                  ? `${(item.weight / 1000).toFixed(2)} kg`
                                  : `${item.weight} g`
                                : "?"}{" "}
                              · {formatCurrencyBRL(item.price_per_kg)}/kg
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="w-3 h-3" />
                              {item.quantity ?? "?"}x ·{" "}
                              {formatCurrencyBRL(item.unit_price)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
