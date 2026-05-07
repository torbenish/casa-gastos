"use client";

import { Eye, Plus, Receipt, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { GastoDetalhesModal } from "@/components/gasto-detalhes-modal";
import { NovoGastoModal } from "@/components/novo-gasto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase";

type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  scope: string;
  notes: string | null;
  receipt_url: string | null;
  category_id?: string;
  paid_by?: string;

  parent_expense_id?: string | null;
  installment_number?: number;
  installments?: number;

  // CORREÇÃO: categories e paid_by_user são OBJETOS, não arrays
  categories: { id: string; name: string } | null;
  paid_by_user: { id: string; name: string } | null;
};

type Category = {
  id: string;
  name: string;
  type: string;
  default_scope: string;
  place_type: string | null;
};

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const scopeLabel: Record<string, string> = {
  joint: "Conjunto",
  mine: "Individual",
  hers: "Individual",
};

const scopeColor: Record<string, string> = {
  joint:
    "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  mine: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  hers: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
};

export default function GastosPage() {
  const now = new Date();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterScope, setFilterScope] = useState("all");
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"monthly" | "grouped">("monthly");
  const [users, setUsers] = useState<
    {
      id: string;
      name: string;
      salary: number;
      role: string;
    }[]
  >([]);
  const supabase = createClient();

  const loadExpenses = useCallback(async () => {
    setLoading(true);

    const startDate = `${filterYear}-${String(filterMonth).padStart(2, "0")}-01`;
    const endMonth = Number(filterMonth) === 12 ? 1 : Number(filterMonth) + 1;
    const endYear =
      Number(filterMonth) === 12 ? Number(filterYear) + 1 : Number(filterYear);
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    // CORREÇÃO: Incluir os relacionamentos na query do Supabase
    let query = supabase
      .from("expenses")
      .select(
        `id, description, amount, date, scope, notes, receipt_url, category_id, paid_by, parent_expense_id, installment_number, installments,
        categories:category_id(id, name),
        paid_by_user:paid_by(id, name)`,
      )
      .gte("date", startDate)
      .lt("date", endDate)
      .order("date", { ascending: false });

    if (filterCategory !== "all") {
      query = query.eq("category_id", filterCategory);
    }

    if (filterScope !== "all") {
      query = query.eq("scope", filterScope);
    }

    const { data: expensesData, error } = await query;

    if (error) {
      console.error("Erro ao carregar despesas:", error);
      setLoading(false);
      return;
    }

    if (!expensesData) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const normalizedExpenses: Expense[] = expensesData.map((expense) => ({
      ...expense,
      categories: Array.isArray(expense.categories)
        ? (expense.categories[0] ?? null)
        : expense.categories,
      paid_by_user: Array.isArray(expense.paid_by_user)
        ? (expense.paid_by_user[0] ?? null)
        : expense.paid_by_user,
    }));

    setExpenses(normalizedExpenses);
    setLoading(false);
  }, [supabase, filterMonth, filterYear, filterCategory, filterScope]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    async function loadInitialData() {
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("id, name, type, default_scope, place_type")
        .order("name");

      if (categoriesData) {
        setCategories(categoriesData);
      }

      const { data: usersData } = await supabase
        .from("users")
        .select("id, name, salary, role");

      if (usersData) {
        setUsers(
          usersData.map((u) => ({
            ...u,
            salary: Number(u.salary),
          })),
        );
      }
    }

    loadInitialData();
  }, [supabase]);

  async function handleDelete(id: string) {
    await supabase.from("expenses").delete().eq("id", id);
    await loadExpenses();
  }

  const total = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const totalJoint = expenses
    .filter((e) => e.scope === "joint")
    .reduce((acc, e) => acc + Number(e.amount), 0);

  const sortedUsers = [...users].sort((a, b) => b.salary - a.salary);

  const myUser = sortedUsers[0];
  const herUser = sortedUsers[1];

  const mySalary = Number(myUser?.salary ?? 0);
  const herSalary = Number(herUser?.salary ?? 0);

  const totalSalary = mySalary + herSalary;

  const myPercentage = totalSalary > 0 ? mySalary / totalSalary : 0;

  const herPercentage = totalSalary > 0 ? herSalary / totalSalary : 0;

  const myShare = totalJoint * myPercentage;
  const herShare = totalJoint * herPercentage;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gastos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie todas as despesas do mês
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setModalOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo gasto
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <Select
              value={viewMode}
              onValueChange={(v: "monthly" | "grouped") => setViewMode(v)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Visualização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Por mês</SelectItem>
                <SelectItem value="grouped">Agrupado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>

              <SelectContent>
                {Array.from(
                  { length: 10 },
                  (_, i) => new Date().getFullYear() + i,
                ).map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterScope} onValueChange={setFilterScope}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="joint">Conjunto</SelectItem>
                <SelectItem value="mine">Meu</SelectItem>
                <SelectItem value="hers">Dela</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Total do período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Total conjunto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600">
              {totalJoint.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Sua parte proporcional
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {myShare.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              {(myPercentage * 100).toFixed(1)}% do total conjunto
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Parte dela
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-bold text-pink-600">
              {herShare.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              {(herPercentage * 100).toFixed(1)}% do total conjunto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground text-sm">
              Carregando...
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Receipt className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhum gasto encontrado</p>
            </div>
          ) : (
            <div className="divide-y">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between py-3 rounded-lg px-2 -mx-2 hover:bg-muted/40 transition-colors"
                >
                  {/* Lado esquerdo — clicável */}
                  <button
                    type="button"
                    className="flex items-center gap-3 flex-1 text-left min-w-0"
                    onClick={() => setSelectedExpenseId(expense.id)}
                  >
                    <div className="bg-violet-100 dark:bg-violet-900 p-2 rounded-lg shrink-0">
                      <Receipt className="w-3 h-3 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {expense.description}
                        {expense.installments && expense.installments > 1 && (
                          <span className="text-muted-foreground ml-1">
                            ({expense.installment_number}/{expense.installments}
                            )
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-xs text-muted-foreground">
                          {/* CORREÇÃO: Acessar diretamente .name ao invés de [0].name */}
                          {expense.categories?.name ?? "Sem categoria"} •{" "}
                          {new Date(
                            `${expense.date}T00:00:00`,
                          ).toLocaleDateString("pt-BR")}
                        </p>

                        {/* CORREÇÃO: Acessar diretamente .name ao invés de [0].name */}
                        {expense.paid_by_user?.name && (
                          <p className="text-xs text-muted-foreground">
                            • Pago por {expense.paid_by_user.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Lado direito */}
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <div className="text-right mr-1">
                      <p className="text-sm font-semibold">
                        {Number(expense.amount).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                      <Badge
                        className={`text-xs mt-0.5 ${scopeColor[expense.scope]}`}
                        variant="outline"
                      >
                        {scopeLabel[expense.scope]}
                      </Badge>
                    </div>

                    {/* Ver detalhes */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-violet-600"
                      onClick={() => setSelectedExpenseId(expense.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {/* Deletar */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(expense.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NovoGastoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadExpenses}
        categories={categories}
      />

      <GastoDetalhesModal
        expenseId={selectedExpenseId}
        open={!!selectedExpenseId}
        onClose={() => setSelectedExpenseId(null)}
      />
    </div>
  );
}
