"use client";

import {
  Calendar,
  CreditCard,
  FileText,
  Hash,
  Layers,
  MapPin,
  Package,
  Receipt,
  Scale,
  ShoppingCart,
  Tag,
  User,
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
import { PLACE_TYPE_CONFIG, PlaceType } from "./novo-gasto/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type ExpenseItem = {
  id: string;
  product_id: string | null;
  productName: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  weight: number | null;
  price_per_kg: number | null;
  measurement_type: "unit" | "weight" | null;
};

type ExpenseDetails = {
  id: string;
  description: string;
  amount: number;
  date: string;
  scope: string;
  notes: string | null;
  receipt_url: string | null;
  payment_method: string | null;
  installments: number | null;
  installment_number: number | null;
  parent_expense_id: string | null;
  subcategory: {
    name: string;
    icon: string;
    color: string;
  } | null;
  placeName: string | null;
  placeKind: PlaceType | null;
  paidByName: string | null;
  cardName: string | null;
  cardType: string | null;
  items: ExpenseItem[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SCOPE_LABEL: Record<string, string> = {
  joint: "Conjunto",
  mine: "Meu",
  hers: "Dela",
};

const SCOPE_COLOR: Record<string, string> = {
  joint:
    "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  mine: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  hers: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX",
  debito: "Debito",
  dinheiro: "Dinheiro",
  transferencia: "Transferencia",
  credito: "Cartao de credito",
  vale_alimentacao: "Vale alimentacao",
};

function getPlaceTypeInfo(type: PlaceType) {
  return PLACE_TYPE_CONFIG[type] ?? PLACE_TYPE_CONFIG.outros;
}

type Props = {
  expenseId: string | null;
  open: boolean;
  onClose: () => void;
};

export function GastoDetalhesModal({ expenseId, open, onClose }: Props) {
  const [details, setDetails] = useState<ExpenseDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!expenseId || !open) return;

    async function load() {
      setLoading(true);
      setDetails(null);

      const { data: expense } = await supabase
        .from("expenses")
        .select(`
          id,
          description,
          amount,
          date,
          scope,
          notes,
          receipt_url,
          payment_method,
          installments,
          installment_number,
          parent_expense_id,

          subcategory_id,

          place_id,
          paid_by,
          credit_card_id
        `)
        .eq("id", expenseId)
        .single();

      if (!expense) {
        setLoading(false);
        return;
      }

      const [catRes, placeRes, userRes, cardRes, itemsRes] = await Promise.all([
        expense.subcategory_id
          ? supabase
              .from("subcategories")
              .select("name, icon, color")
              .eq("id", expense.subcategory_id)
              .single()
          : Promise.resolve({ data: null }),

        expense.place_id
          ? supabase
              .from("places")
              .select("name, type")
              .eq("id", expense.place_id)
              .single()
          : Promise.resolve({ data: null }),

        expense.paid_by
          ? supabase
              .from("users")
              .select("name")
              .eq("id", expense.paid_by)
              .single()
          : Promise.resolve({ data: null }),

        expense.credit_card_id
          ? supabase
              .from("credit_cards")
              .select("name, card_type")
              .eq("id", expense.credit_card_id)
              .single()
          : Promise.resolve({ data: null }),
        supabase
          .from("expense_items")
          .select(`
            *,
            products(name)
          `)
          .eq("expense_id", expenseId),
        supabase.from("expense_items").select("*").eq("expense_id", expenseId),
      ]);

      const rawItems = itemsRes.data ?? [];

      const normalizedItems: ExpenseItem[] = rawItems.map((raw) => ({
        id: raw.id as string,

        product_id: raw.product_id as string | null,

        productName:
          (
            raw.products as {
              name?: string;
            } | null
          )?.name ?? null,

        quantity: raw.quantity as number | null,

        unit_price: raw.unit_price as number | null,

        total_price: raw.total_price as number | null,

        weight: (raw.weight as number | null) ?? null,

        price_per_kg: (raw.price_per_kg as number | null) ?? null,

        measurement_type:
          (raw.measurement_type as "unit" | "weight" | null) ?? null,
      }));

      setDetails({
        ...expense,
        subcategory: catRes.data
          ? {
              name: catRes.data.name,
              icon: catRes.data.icon,
              color: catRes.data.color,
            }
          : null,
        placeName: placeRes.data?.name ?? null,
        placeKind:
          ((placeRes.data as { type?: PlaceType } | null)?.type as
            | PlaceType
            | undefined) ?? null,
        paidByName: userRes.data?.name ?? null,
        cardName: cardRes.data?.name ?? null,
        cardType:
          (cardRes.data as { card_type?: string } | null)?.card_type ?? null,
        items: normalizedItems,
      });

      setLoading(false);
    }

    load();
  }, [expenseId, open, supabase]);

  const isInstallment = details?.installments && details.installments > 1;

  const itemsTotal =
    details?.items.reduce((acc, item) => {
      if (item.measurement_type === "weight") {
        return acc + ((item.weight ?? 0) / 1000) * (item.price_per_kg ?? 0);
      }
      return acc + Number(item.total_price ?? 0);
    }, 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-violet-600" />
            Detalhes do gasto
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-10 text-muted-foreground text-sm">
            Carregando...
          </div>
        )}

        {!loading && details && (
          <div className="space-y-5 pt-1">
            {/* Cabecalho */}
            <div className="space-y-1">
              <p className="text-lg font-semibold">{details.description}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={SCOPE_COLOR[details.scope]}>
                  {SCOPE_LABEL[details.scope] ?? details.scope}
                </Badge>
                {isInstallment && (
                  <Badge variant="outline" className="text-xs">
                    Parcela {details.installment_number}/{details.installments}
                  </Badge>
                )}
              </div>
            </div>

            {/* Valor */}
            <div className="bg-violet-50 dark:bg-violet-950 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Valor</p>
              <p className="text-3xl font-bold text-violet-600">
                {Number(details.amount).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
              {isInstallment && (
                <p className="text-xs text-muted-foreground mt-1">
                  Total:{" "}
                  {(
                    Number(details.amount) * (details.installments ?? 1)
                  ).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}{" "}
                  em {details.installments}x
                </p>
              )}
            </div>

            {/* Informacoes */}
            <div className="space-y-3">
              <Row
                icon={<Calendar className="w-4 h-4" />}
                label="Data"
                value={new Date(`${details.date}T00:00:00`).toLocaleDateString(
                  "pt-BR",
                  {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  },
                )}
              />
              {details.subcategory && (
                <div className="flex items-start gap-3">
                  <div className="text-muted-foreground mt-0.5 shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Subcategoria
                    </p>

                    <Badge className={details.subcategory.color}>
                      {details.subcategory.name}
                    </Badge>
                  </div>
                </div>
              )}
              {details.paidByName && (
                <Row
                  icon={<User className="w-4 h-4" />}
                  label="Pago por"
                  value={details.paidByName}
                />
              )}
              {details.payment_method && (
                <Row
                  icon={<Receipt className="w-4 h-4" />}
                  label="Forma de pagamento"
                  value={
                    PAYMENT_LABELS[details.payment_method] ??
                    details.payment_method
                  }
                />
              )}
              {details.cardName && (
                <Row
                  icon={<CreditCard className="w-4 h-4" />}
                  label="Cartao"
                  value={details.cardName}
                />
              )}
              {details.placeName && (
                <div className="flex items-start gap-3">
                  <div className="text-muted-foreground mt-0.5 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-muted-foreground">Local</p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{details.placeName}</p>

                      {details.placeKind &&
                        (() => {
                          const config = getPlaceTypeInfo(details.placeKind);

                          const Icon = config.icon;

                          return (
                            <Badge className={`text-xs ${config.color}`}>
                              <Icon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          );
                        })()}
                    </div>
                  </div>
                </div>
              )}
              {isInstallment && (
                <Row
                  icon={<Layers className="w-4 h-4" />}
                  label="Parcelamento"
                  value={`${details.installments}x de ${Number(details.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}
                />
              )}
              {details.notes && (
                <Row
                  icon={<FileText className="w-4 h-4" />}
                  label="Observacoes"
                  value={details.notes}
                />
              )}
            </div>

            {details.items.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Itens da compra ({details.items.length})
                  </p>
                </div>

                <div className="border rounded-lg overflow-hidden divide-y">
                  {details.items.map((item) => {
                    const isWeight = item.measurement_type === "weight";
                    const itemTotal = isWeight
                      ? ((item.weight ?? 0) / 1000) * (item.price_per_kg ?? 0)
                      : Number(item.total_price ?? 0);

                    return (
                      <div key={item.id} className="px-3 py-3 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isWeight ? (
                              <Scale className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            ) : (
                              <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            )}
                            <span className="text-sm font-medium truncate">
                              {item.productName ?? "Produto sem nome"}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-violet-600 shrink-0">
                            {itemTotal.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>

                        {isWeight ? (
                          <div className="flex gap-4 text-xs text-muted-foreground pl-5">
                            <span>
                              Peso:{" "}
                              <span className="text-foreground font-medium">
                                {item.weight != null
                                  ? item.weight >= 1000
                                    ? `${(item.weight / 1000).toFixed(2)} kg`
                                    : `${item.weight} g`
                                  : "?"}
                              </span>
                            </span>
                            <span>
                              Preço/kg:{" "}
                              <span className="text-foreground font-medium">
                                {item.price_per_kg != null
                                  ? Number(item.price_per_kg).toLocaleString(
                                      "pt-BR",
                                      { style: "currency", currency: "BRL" },
                                    )
                                  : "?"}
                              </span>
                            </span>
                          </div>
                        ) : (
                          <div className="flex gap-4 text-xs text-muted-foreground pl-5">
                            <span>
                              Qtd:{" "}
                              <span className="text-foreground font-medium">
                                {item.quantity ?? "?"}
                              </span>
                            </span>
                            <span>
                              Unit.:{" "}
                              <span className="text-foreground font-medium">
                                {item.unit_price != null
                                  ? Number(item.unit_price).toLocaleString(
                                      "pt-BR",
                                      { style: "currency", currency: "BRL" },
                                    )
                                  : "?"}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between px-3 py-2.5 bg-muted/40 text-sm font-semibold">
                    <span>Total da compra</span>
                    <span className="text-violet-600">
                      {itemsTotal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {details.receipt_url && (
              <a
                href={details.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-violet-600 hover:underline"
              >
                <Hash className="w-4 h-4" />
                Ver comprovante
              </a>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
