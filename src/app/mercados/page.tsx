"use client";

import {
  AlertCircle,
  ChevronRight,
  Package,
  Search,
  ShoppingCart,
  Store,
  TrendingDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PlaceType } from "@/components/novo-gasto/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";

type PlaceSummary = {
  id: string;
  name: string;
  type: PlaceType;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string | null;
  productCount: number;
  hasDetailedItems: boolean;
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor(
    (Date.now() - new Date(`${dateStr}T00:00:00`).getTime()) / 86400000,
  );
  if (diff === 0) return "hoje";
  if (diff === 1) return "ontem";
  if (diff < 7) return `${diff} dias atrás`;
  if (diff < 30) return `${Math.floor(diff / 7)} sem. atrás`;
  if (diff < 365) return `${Math.floor(diff / 30)} meses atrás`;
  return `${Math.floor(diff / 365)} ano(s) atrás`;
}

export default function MercadosPage() {
  const [places, setPlaces] = useState<PlaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const { data: placesData, error: placesError } = await supabase
          .from("places")
          .select("id, name, type")
          .eq("type", "mercado")
          .order("name");

        if (placesError) {
          throw placesError;
        }

        if (!placesData || placesData.length === 0) {
          setPlaces([]);
          return;
        }

        const summaries = await Promise.all(
          placesData.map(async (place) => {
            const { data: expenses, error: expensesError } = await supabase
              .from("expenses")
              .select("id, amount, date")
              .eq("place_id", place.id)
              .order("date", { ascending: false });

            if (expensesError) {
              throw expensesError;
            }

            const expList = expenses ?? [];

            const totalSpent = expList.reduce(
              (acc, e) => acc + Number(e.amount),
              0,
            );

            const expenseIds = expList.map((e) => e.id);

            let productCount = 0;
            let hasDetailedItems = false;

            if (expenseIds.length > 0) {
              const { data: items, error: itemsError } = await supabase
                .from("expense_items")
                .select("product_id")
                .in("expense_id", expenseIds)
                .not("product_id", "is", null);

              if (itemsError) {
                throw itemsError;
              }

              const uniqueProducts = new Set(
                (items ?? []).map((i) => i.product_id),
              );

              productCount = uniqueProducts.size;
              hasDetailedItems = (items ?? []).length > 0;
            }

            return {
              id: place.id,
              name: place.name,
              type: place.type,
              totalVisits: expList.length,
              totalSpent,
              lastVisit: expList[0]?.date ?? null,
              productCount,
              hasDetailedItems,
            };
          }),
        );

        summaries.sort((a, b) => {
          if (a.hasDetailedItems !== b.hasDetailedItems) {
            return a.hasDetailedItems ? -1 : 1;
          }

          if (!a.lastVisit) return 1;
          if (!b.lastVisit) return -1;

          return (
            new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
          );
        });

        setPlaces(summaries);
      } catch (error) {
        console.error("Erro ao carregar mercados:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [supabase]);

  const filtered = places.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalMercados = places.length;
  const totalGasto = places.reduce((acc, p) => acc + p.totalSpent, 0);
  const totalProdutos = places.reduce((acc, p) => acc + p.productCount, 0);
  const totalVisits = places.reduce((acc, p) => acc + p.totalVisits, 0);

  const averageTicket = totalVisits > 0 ? totalGasto / totalVisits : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mercados</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Histórico de preços por local de compra
          </p>
        </div>
      </div>

      {/* Resumo geral */}
      {!loading && places.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Locais cadastrados",
              value: totalMercados,
              icon: <Store className="w-3.5 h-3.5" />,
            },
            {
              label: "Produtos rastreados",
              value: totalProdutos,
              icon: <Package className="w-3.5 h-3.5" />,
            },
            {
              label: "Gasto acumulado",
              value: formatBRL(totalGasto),
              icon: <TrendingDown className="w-3.5 h-3.5" />,
            },
            {
              label: "Ticket médio",
              value: formatBRL(averageTicket),
              icon: <ShoppingCart className="w-3.5 h-3.5" />,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="border rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <div className="text-muted-foreground">{s.icon}</div>
              <div>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <p className="font-semibold text-sm">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar mercado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground text-sm">
          Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Store className="w-8 h-8 opacity-40" />
          <p className="text-sm">Nenhum mercado encontrado</p>
          <p className="text-xs opacity-70">
            Cadastre locais do tipo "Mercado" ao adicionar gastos
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => router.push(`/mercados/${place.id}`)}
              className="text-left w-full"
            >
              <div className="border rounded-xl p-4 hover:border-violet-400 dark:hover:border-violet-600 transition-all hover:shadow-sm bg-card group cursor-pointer">
                {/* Topo */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-violet-100 dark:bg-violet-900 p-2.5 rounded-xl group-hover:bg-violet-200 dark:group-hover:bg-violet-800 transition-colors shrink-0">
                      <Store className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{place.name}</p>

                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {place.productCount}{" "}
                          {place.productCount === 1 ? "produto" : "produtos"}
                        </Badge>

                        {!place.hasDetailedItems && place.totalVisits > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300 dark:border-amber-700"
                          >
                            sem itens detalhados
                          </Badge>
                        )}
                      </div>
                      {place.lastVisit && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Última visita{" "}
                          <span className="font-medium text-foreground">
                            {timeAgo(place.lastVisit)}
                          </span>{" "}
                          · {formatDate(place.lastVisit)}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-600 transition-colors shrink-0 mt-0.5" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t">
                  <div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" />
                      Visitas
                    </p>
                    <p className="text-sm font-bold mt-0.5">
                      {place.totalVisits}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      Gasto acumulado
                    </p>
                    <p className="text-sm font-bold mt-0.5">
                      {formatBRL(place.totalSpent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Produtos
                    </p>
                    <p
                      className={`text-sm font-bold mt-0.5 ${
                        place.productCount === 0 ? "text-muted-foreground" : ""
                      }`}
                    >
                      {place.productCount === 0 ? "—" : place.productCount}
                    </p>
                  </div>
                </div>

                {/* Aviso sem itens */}
                {!place.hasDetailedItems && place.totalVisits > 0 && (
                  <div className="mt-3 pt-3 border-t flex items-start gap-2 text-amber-600 dark:text-amber-500">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p className="text-xs">
                      Os gastos neste local não têm itens detalhados. Adicione
                      produtos ao registrar uma compra para ver o histórico de
                      preços.
                    </p>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
