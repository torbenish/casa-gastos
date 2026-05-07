"use client";

import {
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
  Minus,
  Package,
  Search,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Place = { id: string; name: string; type: string };

type PriceRecord = {
  date: string;
  price: number;
  expense_id: string;
  measurement_type: "unit" | "weight";
};

type Product = {
  id: string;
  name: string;
  records: PriceRecord[];
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  minDate: string;
  maxDate: string;
  variation: number;
  lastSeen: string;
};

type PlaceStats = {
  totalVisits: number;
  lastVisit: string | null;
  totalSpent: number;
  avgSpentPerVisit: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ records }: { records: PriceRecord[] }) {
  if (records.length < 2) {
    return (
      <span className="text-[10px] text-muted-foreground italic">
        1 registro
      </span>
    );
  }

  const prices = records.map((r) => r.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const W = 80;
  const H = 28;
  const pad = 3;

  const points = prices.map((p, i) => {
    const x = pad + (i / (prices.length - 1)) * (W - pad * 2);
    const y = pad + ((max - p) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const last = prices[prices.length - 1];
  const first = prices[0];
  const color = last > first ? "#ef4444" : last < first ? "#22c55e" : "#94a3b8";

  const lastPt = points[points.length - 1].split(",");

  return (
    <svg
      width={W}
      height={H}
      className="shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="2.5" fill={color} />
    </svg>
  );
}

// ─── Histórico expandido ──────────────────────────────────────────────────────

function ProductHistory({ product }: { product: Product }) {
  const sorted = [...product.records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="mt-3 border-t pt-3 space-y-1">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Histórico completo
      </p>
      <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1">
        {sorted.map((record, i) => {
          const prev = sorted[i + 1];
          const diff = prev ? record.price - prev.price : 0;
          const pct = prev && prev.price > 0 ? (diff / prev.price) * 100 : 0;
          const isCheapest = record.price === product.minPrice;
          const isMostExpensive =
            record.price === product.maxPrice &&
            product.minPrice !== product.maxPrice;

          return (
            <div
              key={record.expense_id}
              className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground shrink-0 w-24">
                  {formatDate(record.date)}
                </span>
                <div className="flex gap-1 flex-wrap">
                  {isCheapest && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 text-green-600 border-green-300 dark:border-green-700"
                    >
                      mais barato
                    </Badge>
                  )}
                  {isMostExpensive && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 text-red-500 border-red-300 dark:border-red-700"
                    >
                      mais caro
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {prev && diff !== 0 && (
                  <span
                    className={`text-[11px] flex items-center gap-0.5 ${
                      diff > 0 ? "text-red-500" : "text-green-600"
                    }`}
                  >
                    {diff > 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {Math.abs(pct).toFixed(1)}%
                  </span>
                )}
                {prev && diff === 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    igual
                  </span>
                )}
                <span className="text-sm font-semibold tabular-nums">
                  {formatBRL(record.price)}
                  {record.measurement_type === "weight" && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      /kg
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Card de produto ──────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const [expanded, setExpanded] = useState(false);
  const hasMultipleRecords = product.records.length > 1;
  const priceChanged = product.minPrice !== product.maxPrice;

  const trend =
    product.variation > 0 ? "up" : product.variation < 0 ? "down" : "flat";

  return (
    <div className="border rounded-xl p-4 hover:border-violet-300 dark:hover:border-violet-700 transition-colors bg-card">
      <div className="flex items-start justify-between gap-3">
        {/* Esquerda */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="bg-violet-100 dark:bg-violet-900 p-2 rounded-lg shrink-0 mt-0.5">
            <Package className="w-4 h-4 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{product.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Última compra: {formatDate(product.lastSeen)}
            </p>

            {/* Min/Max — só mostra se houve variação real */}
            {priceChanged ? (
              <div className="flex items-center gap-3 mt-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">
                    Mínimo histórico
                  </p>
                  <p className="text-xs font-semibold text-green-600 tabular-nums">
                    {formatBRL(product.minPrice)}
                    <span className="text-[10px] text-muted-foreground font-normal ml-1">
                      {formatDateShort(product.minDate)}
                    </span>
                  </p>
                </div>
                <div className="w-px h-6 bg-border" />
                <div>
                  <p className="text-[10px] text-muted-foreground">
                    Máximo histórico
                  </p>
                  <p className="text-xs font-semibold text-red-500 tabular-nums">
                    {formatBRL(product.maxPrice)}
                    <span className="text-[10px] text-muted-foreground font-normal ml-1">
                      {formatDateShort(product.maxDate)}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Preço estável em todos os registros
              </p>
            )}
          </div>
        </div>

        {/* Direita */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums">
              {formatBRL(product.currentPrice)}
              {product.records[0]?.measurement_type === "weight" && (
                <span className="text-xs text-muted-foreground font-normal">
                  /kg
                </span>
              )}
            </p>

            {/* Variação — só mostra se tem histórico E mudou */}
            {hasMultipleRecords && product.variation !== 0 && (
              <p
                className={`text-xs flex items-center justify-end gap-0.5 mt-0.5 ${
                  trend === "up" ? "text-red-500" : "text-green-600"
                }`}
              >
                {trend === "up" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(product.variation).toFixed(1)}% vs anterior
              </p>
            )}

            {hasMultipleRecords && product.variation === 0 && (
              <p className="text-xs text-muted-foreground flex items-center justify-end gap-0.5 mt-0.5">
                <Minus className="w-3 h-3" />
                Sem variação
              </p>
            )}

            {!hasMultipleRecords && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                1ª compra registrada
              </p>
            )}
          </div>

          <Sparkline records={product.records} />

          {hasMultipleRecords && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Ver {product.records.length} registros
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {expanded && <ProductHistory product={product} />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MercadoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const placeId = params?.id as string;

  const [place, setPlace] = useState<Place | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<PlaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    "name" | "price" | "variation" | "lastSeen"
  >("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const supabase = createClient();

  useEffect(() => {
    if (!placeId) return;

    async function load() {
      setLoading(true);

      const { data: placeData } = await supabase
        .from("places")
        .select("id, name, type")
        .eq("id", placeId)
        .single();

      if (!placeData) {
        setLoading(false);
        return;
      }
      setPlace(placeData);

      const { data: expensesData } = await supabase
        .from("expenses")
        .select("id, amount, date")
        .eq("place_id", placeId)
        .order("date", { ascending: false });

      const expenses = expensesData ?? [];
      const totalSpent = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
      setStats({
        totalVisits: expenses.length,
        lastVisit: expenses[0]?.date ?? null,
        totalSpent,
        avgSpentPerVisit:
          expenses.length > 0 ? totalSpent / expenses.length : 0,
      });

      if (expenses.length === 0) {
        setLoading(false);
        return;
      }

      const expenseIds = expenses.map((e) => e.id);

      const { data: itemsData } = await supabase
        .from("expense_items")
        .select(
          "id, product_id, quantity, unit_price, total_price, weight, price_per_kg, measurement_type, expense_id, products(id, name)",
        )
        .in("expense_id", expenseIds);

      const items = itemsData ?? [];
      const productMap = new Map<
        string,
        { id: string; name: string; records: PriceRecord[] }
      >();

      for (const item of items) {
        const productsRaw = (item as Record<string, unknown>).products;
        let productName = "Produto desconhecido";
        let productId = item.product_id as string | null;

        if (Array.isArray(productsRaw) && productsRaw[0]) {
          productName = (productsRaw[0] as { name: string }).name;
          productId = (productsRaw[0] as { id: string }).id ?? productId;
        } else if (productsRaw && typeof productsRaw === "object") {
          productName = (productsRaw as { name: string }).name;
          productId = (productsRaw as { id: string }).id ?? productId;
        }

        if (!productId) continue;

        const expense = expenses.find((e) => e.id === item.expense_id);
        if (!expense) continue;

        const isByWeight = item.measurement_type === "weight";
        const price = isByWeight
          ? Number(item.price_per_kg ?? 0)
          : Number(item.unit_price ?? 0);

        if (price <= 0) continue;

        const record: PriceRecord = {
          date: expense.date,
          price,
          expense_id: expense.id,
          measurement_type:
            (item.measurement_type as "unit" | "weight") ?? "unit",
        };

        const existing = productMap.get(productId);
        if (existing) {
          existing.records.push(record);
        } else {
          productMap.set(productId, {
            id: productId,
            name: productName,
            records: [record],
          });
        }
      }

      const processedProducts: Product[] = [];

      for (const [, p] of productMap) {
        const sorted = [...p.records].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

        const prices = sorted.map((r) => r.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const minRecord = sorted.find((r) => r.price === minPrice);
        const maxRecord = sorted.find((r) => r.price === maxPrice);

        if (!minRecord || !maxRecord) {
          continue;
        }
        const currentPrice = sorted[sorted.length - 1].price;
        const prevPrice =
          sorted.length > 1 ? sorted[sorted.length - 2].price : currentPrice;
        const variation =
          prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;

        processedProducts.push({
          id: p.id,
          name: p.name,
          records: sorted,
          currentPrice,
          minPrice,
          maxPrice,
          minDate: minRecord.date,
          maxDate: maxRecord.date,
          variation,
          lastSeen: sorted[sorted.length - 1].date,
        });
      }

      setProducts(processedProducts);
      setLoading(false);
    }

    load();
  }, [placeId, supabase]);

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    );
    list = list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "price") cmp = a.currentPrice - b.currentPrice;
      else if (sortBy === "variation") cmp = a.variation - b.variation;
      else if (sortBy === "lastSeen")
        cmp = new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [products, search, sortBy, sortDir]);

  // Comparadores — só produtos com múltiplos registros e variação real
  const productsWithHistory = useMemo(
    () => products.filter((p) => p.records.length > 1),
    [products],
  );

  const biggestIncrease = useMemo(
    () =>
      [...productsWithHistory]
        .filter((p) => p.variation > 0)
        .sort((a, b) => b.variation - a.variation)[0],
    [productsWithHistory],
  );

  const biggestDecrease = useMemo(
    () =>
      [...productsWithHistory]
        .filter((p) => p.variation < 0)
        .sort((a, b) => a.variation - b.variation)[0],
    [productsWithHistory],
  );

  const bestDeal = useMemo(
    () =>
      [...productsWithHistory]
        .filter((p) => p.maxPrice > p.currentPrice)
        .sort(
          (a, b) => a.currentPrice / a.maxPrice - b.currentPrice / b.maxPrice,
        )[0],
    [productsWithHistory],
  );

  const hasAnyInsight = biggestIncrease || biggestDecrease || bestDeal;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Carregando...
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
        <AlertCircle className="w-8 h-8 opacity-40" />
        <p className="text-sm">Local não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Voltar + Header */}
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground -ml-2 mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Mercados
        </Button>

        <div className="flex items-start gap-3">
          <div className="bg-violet-100 dark:bg-violet-900 p-3 rounded-xl">
            <MapPin className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{place.name}</h1>
            <p className="text-muted-foreground text-sm mt-0.5 capitalize">
              {place.type}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Visitas",
              value: stats.totalVisits,
              icon: <ShoppingCart className="w-3.5 h-3.5" />,
              sub: null,
            },
            {
              label: "Última visita",
              value: stats.lastVisit ? formatDate(stats.lastVisit) : "—",
              icon: <Calendar className="w-3.5 h-3.5" />,
              sub: null,
            },
            {
              label: "Total gasto",
              value: formatBRL(stats.totalSpent),
              icon: <TrendingDown className="w-3.5 h-3.5" />,
              sub: null,
            },
            {
              label: "Média por visita",
              value: formatBRL(stats.avgSpentPerVisit),
              icon: <Package className="w-3.5 h-3.5" />,
              sub: null,
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  {s.icon}
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <p className="text-lg font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Comparador de insights — só aparece se tiver dados úteis */}
      {hasAnyInsight && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Insights de preço
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {biggestIncrease && (
              <div className="border border-red-200 dark:border-red-900 rounded-xl p-4 bg-red-50 dark:bg-red-950/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                    Maior alta
                  </p>
                </div>
                <p className="font-semibold text-sm">{biggestIncrease.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatBRL(biggestIncrease.currentPrice)}{" "}
                  <span className="text-red-500 font-semibold">
                    +{biggestIncrease.variation.toFixed(1)}%
                  </span>{" "}
                  vs compra anterior
                </p>
              </div>
            )}

            {biggestDecrease && (
              <div className="border border-green-200 dark:border-green-900 rounded-xl p-4 bg-green-50 dark:bg-green-950/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-green-500" />
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                    Maior queda
                  </p>
                </div>
                <p className="font-semibold text-sm">{biggestDecrease.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatBRL(biggestDecrease.currentPrice)}{" "}
                  <span className="text-green-600 font-semibold">
                    {biggestDecrease.variation.toFixed(1)}%
                  </span>{" "}
                  vs compra anterior
                </p>
              </div>
            )}

            {bestDeal && (
              <div className="border border-violet-200 dark:border-violet-900 rounded-xl p-4 bg-violet-50 dark:bg-violet-950/30">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-violet-500" />
                  <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">
                    Boa hora p/ comprar
                  </p>
                </div>
                <p className="font-semibold text-sm">{bestDeal.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Preço atual{" "}
                  <span className="text-violet-600 font-semibold">
                    {(
                      ((bestDeal.maxPrice - bestDeal.currentPrice) /
                        bestDeal.maxPrice) *
                      100
                    ).toFixed(0)}
                    %
                  </span>{" "}
                  abaixo do pico histórico
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Catálogo */}
      {products.length === 0 ? (
        <div className="border rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center">
          <div className="bg-muted rounded-full p-4">
            <Package className="w-6 h-6 text-muted-foreground opacity-60" />
          </div>
          <div>
            <p className="text-sm font-medium">Nenhum produto registrado</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Ao adicionar um gasto neste local, inclua os itens comprados para
              começar a rastrear os preços.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as typeof sortBy)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="price">Preço atual</SelectItem>
                <SelectItem value="variation">Variação</SelectItem>
                <SelectItem value="lastSeen">Última compra</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortDir}
              onValueChange={(v) => setSortDir(v as "asc" | "desc")}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Crescente</SelectItem>
                <SelectItem value="desc">Decrescente</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-3 py-2 text-xs transition-colors ${
                  viewMode === "cards"
                    ? "bg-violet-600 text-white"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 text-xs transition-colors ${
                  viewMode === "table"
                    ? "bg-violet-600 text-white"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                Tabela
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {filteredProducts.length} produto
            {filteredProducts.length !== 1 ? "s" : ""}
            {search
              ? " encontrado" + (filteredProducts.length !== 1 ? "s" : "")
              : " rastreados"}
            {productsWithHistory.length > 0 &&
              ` · ${productsWithHistory.length} com histórico de variação`}
          </p>

          {/* Cards */}
          {viewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Tabela */}
          {viewMode === "table" && (
            <Card>
              <CardContent className="pt-0 px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Produto</TableHead>
                      <TableHead className="text-right">Preço atual</TableHead>
                      <TableHead className="text-right">Variação</TableHead>
                      <TableHead className="text-right">Mínimo</TableHead>
                      <TableHead className="text-right">Máximo</TableHead>
                      <TableHead className="text-right">Compras</TableHead>
                      <TableHead className="text-right pr-6">
                        Tendência
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="pl-6 font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {formatBRL(product.currentPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.records.length < 2 ? (
                            <span className="text-muted-foreground text-xs">
                              1 registro
                            </span>
                          ) : product.variation === 0 ? (
                            <span className="text-muted-foreground text-xs">
                              estável
                            </span>
                          ) : (
                            <Badge
                              variant="outline"
                              className={
                                product.variation > 0
                                  ? "text-red-600 border-red-200 dark:border-red-800"
                                  : "text-green-600 border-green-200 dark:border-green-800"
                              }
                            >
                              {product.variation > 0 ? "+" : ""}
                              {product.variation.toFixed(1)}%
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-green-600 text-sm tabular-nums">
                          {formatBRL(product.minPrice)}
                          <span className="block text-[10px] text-muted-foreground">
                            {formatDateShort(product.minDate)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-red-500 text-sm tabular-nums">
                          {formatBRL(product.maxPrice)}
                          <span className="block text-[10px] text-muted-foreground">
                            {formatDateShort(product.maxDate)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {product.records.length}x
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end">
                            <Sparkline records={product.records} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
