"use client";

import {
  ArrowUpDown,
  Loader2,
  Package,
  Scale,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProdutoDetalhesModal } from "@/components/produto-detalhes-modal";
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

// ─── Types ──────────────────────────────────────────────────────────────────

type MeasurementType = "unit" | "weight";

type ProductRow = {
  id: string;
  name: string;
  created_at: string | null;
};

type ExpenseItemRow = {
  id: string;
  product_id: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  weight: number | null;
  price_per_kg: number | null;
  measurement_type: MeasurementType | null;
  expenses: {
    date: string;
  } | null;
};

type ProductStats = ProductRow & {
  purchaseCount: number;
  lastPurchaseDate: string | null;
  lastUnitPrice: number | null;
  avgUnitPrice: number | null;
  measurementType: MeasurementType | null;
  totalSpent: number;
};

type SortKey = "name" | "purchaseCount" | "lastPurchaseDate" | "lastUnitPrice";
type SortDirection = "asc" | "desc";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrencyBRL(value: number | null) {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateBR(date: string | null) {
  if (!date) return "—";
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

function getUnitPriceFromItem(item: ExpenseItemRow): number | null {
  if (item.measurement_type === "weight") {
    return item.price_per_kg ?? null;
  }
  return item.unit_price ?? null;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ProdutosPage() {
  const [products, setProducts] = useState<ProductStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [productToDelete, setProductToDelete] = useState<ProductStats | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const supabase = createClient();

  const loadProducts = useCallback(async () => {
    setLoading(true);

    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id, name, created_at")
      .order("name");

    if (productsError) {
      console.error("Erro ao carregar produtos:", productsError);
      setLoading(false);
      return;
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from("expense_items")
      .select(
        `id, product_id, quantity, unit_price, total_price, weight, price_per_kg, measurement_type,
        expenses:expense_id(date)`,
      );

    if (itemsError) {
      console.error("Erro ao carregar itens de gastos:", itemsError);
      setLoading(false);
      return;
    }

    const normalizedItems: ExpenseItemRow[] = (itemsData ?? []).map((item) => ({
      ...item,
      expenses: Array.isArray(item.expenses)
        ? (item.expenses[0] ?? null)
        : item.expenses,
    }));

    const stats: ProductStats[] = (productsData ?? []).map((product) => {
      const productItems = normalizedItems.filter(
        (item) => item.product_id === product.id,
      );

      const sortedByDate = [...productItems].sort((a, b) => {
        const dateA = a.expenses?.date ?? "";
        const dateB = b.expenses?.date ?? "";
        return dateB.localeCompare(dateA);
      });

      const lastItem = sortedByDate[0] ?? null;

      const validUnitPrices = productItems
        .map(getUnitPriceFromItem)
        .filter((price): price is number => price != null && price > 0);

      const avgUnitPrice =
        validUnitPrices.length > 0
          ? validUnitPrices.reduce((acc, price) => acc + price, 0) /
            validUnitPrices.length
          : null;

      const totalSpent = productItems.reduce((acc, item) => {
        if (item.measurement_type === "weight") {
          return acc + ((item.weight ?? 0) / 1000) * (item.price_per_kg ?? 0);
        }
        return acc + Number(item.total_price ?? 0);
      }, 0);

      return {
        ...product,
        purchaseCount: productItems.length,
        lastPurchaseDate: lastItem?.expenses?.date ?? null,
        lastUnitPrice: lastItem ? getUnitPriceFromItem(lastItem) : null,
        avgUnitPrice,
        measurementType: lastItem?.measurement_type ?? null,
        totalSpent,
      };
    });

    setProducts(stats);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function handleDelete() {
    if (!productToDelete) return;

    setDeleting(true);

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productToDelete.id);

    setDeleting(false);

    if (error) {
      console.error("Erro ao excluir produto:", error);
      return;
    }

    setProductToDelete(null);
    await loadProducts();
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  const filteredProducts = useMemo(() => {
    let result = products;

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(term));
    }

    const sorted = [...result].sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "purchaseCount":
          comparison = a.purchaseCount - b.purchaseCount;
          break;
        case "lastPurchaseDate":
          comparison = (a.lastPurchaseDate ?? "").localeCompare(
            b.lastPurchaseDate ?? "",
          );
          break;
        case "lastUnitPrice":
          comparison = (a.lastUnitPrice ?? 0) - (b.lastUnitPrice ?? 0);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [products, search, sortKey, sortDirection]);

  const totalProducts = products.length;
  const totalPurchases = products.reduce((acc, p) => acc + p.purchaseCount, 0);
  const totalSpentAll = products.reduce((acc, p) => acc + p.totalSpent, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Produtos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Todos os produtos já cadastrados em suas compras
          </p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Produtos cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Total de compras registradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600">
              {totalPurchases}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Gasto total com produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrencyBRL(totalSpentAll)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produto..."
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Carregando...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort("name")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Produto
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort("purchaseCount")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Compras
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort("lastPurchaseDate")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Última compra
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort("lastUnitPrice")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Último preço
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>Preço médio</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="bg-violet-100 dark:bg-violet-900 p-1.5 rounded-lg shrink-0">
                            {product.measurementType === "weight" ? (
                              <Scale className="w-3.5 h-3.5 text-violet-600" />
                            ) : (
                              <ShoppingBag className="w-3.5 h-3.5 text-violet-600" />
                            )}
                          </div>
                          {product.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {product.purchaseCount}x
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDateBR(product.lastPurchaseDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {formatCurrencyBRL(product.lastUnitPrice)}
                          {product.measurementType === "weight" && (
                            <span className="text-muted-foreground">/kg</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrencyBRL(product.avgUnitPrice)}
                          {product.measurementType === "weight" &&
                            product.avgUnitPrice != null && <span>/kg</span>}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductToDelete(product);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProdutoDetalhesModal
        productId={selectedProductId}
        open={!!selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />

      <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="font-medium text-foreground">
                {productToDelete?.name}
              </span>
              ? Essa ação não pode ser desfeita. Os itens de gastos que já
              referenciam esse produto não serão excluídos, apenas perderão a
              referência ao produto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
