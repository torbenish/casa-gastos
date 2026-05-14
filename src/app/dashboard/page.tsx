"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  TrendingDown,
  UserCheck,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { createClient } from "@/lib/supabase";

const COLORS = [
  "#7c3aed",
  "#a78bfa",
  "#4f46e5",
  "#818cf8",
  "#6366f1",
  "#c4b5fd",
];

type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  scope: string;
  category_id: string | null;
  categoryName: string;
};

type CategoryTotal = {
  name: string;
  value: number;
};

type MonthSummary = {
  month_id: string;
  total_joint: number;
  total_mine: number;
  total_hers: number;
  wife_balance_due: number;
  your_balance_due: number;
};

export default function DashboardPage() {
  const [totalJoint, setTotalJoint] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [variation, setVariation] = useState(0);
  const [difference, setDifference] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function loadDashboard() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const prevMonthDate = new Date(year, month - 2);
      const prevYear = prevMonthDate.getFullYear();
      const prevMonth = prevMonthDate.getMonth() + 1;

      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;

      const endMonth = month === 12 ? 1 : month + 1;
      const endYear = month === 12 ? year + 1 : year;

      const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

      const { data: currentExpenses } = await supabase
        .from("expenses")
        .select("amount, scope")
        .gte("date", startDate)
        .lt("date", endDate);

      const currentTotal =
        currentExpenses
          ?.filter((e) => e.scope === "joint")
          .reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

      const totalMine =
        currentExpenses
          ?.filter((e) => e.scope === "mine")
          .reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

      const totalHers =
        currentExpenses
          ?.filter((e) => e.scope === "hers")
          .reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

      setTotalJoint(currentTotal);

      setSummary({
        month_id: "",
        total_joint: currentTotal,
        total_mine: totalMine,
        total_hers: totalHers,
        wife_balance_due: 0,
        your_balance_due: 0,
      });

      const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;

      const prevEndMonth = prevMonth === 12 ? 1 : prevMonth + 1;
      const prevEndYear = prevMonth === 12 ? prevYear + 1 : prevYear;

      const prevEndDate = `${prevEndYear}-${String(prevEndMonth).padStart(2, "0")}-01`;

      const { data: prevExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .gte("date", prevStartDate)
        .lt("date", prevEndDate);

      const prevTotal =
        prevExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

      let change = 0;

      if (prevTotal > 0) {
        change = ((currentTotal - prevTotal) / prevTotal) * 100;
      }

      setVariation(change);
      setDifference(currentTotal - prevTotal);

      const { data: catsData } = await supabase
        .from("categories")
        .select("id, name");
      const catsMap = Object.fromEntries(
        (catsData ?? []).map((c) => [c.id, c.name]),
      );

      const { data: expenses } = await supabase
        .from("expenses")
        .select("id, description, amount, date, scope, category_id")
        .gte("date", startDate)
        .lt("date", endDate)
        .order("date", { ascending: false })
        .limit(5);

      if (expenses) {
        const merged = expenses.map((e) => ({
          ...e,
          categoryName: e.category_id
            ? (catsMap[e.category_id] ?? "Sem categoria")
            : "Sem categoria",
        }));
        setRecentExpenses(merged);
      }

      const { data: allExpenses } = await supabase
        .from("expenses")
        .select("amount, category_id")
        .gte("date", startDate)
        .lt("date", endDate);

      if (allExpenses) {
        const totals: Record<string, number> = {};
        for (const e of allExpenses) {
          const cat = e.category_id
            ? (catsMap[e.category_id] ?? "Outros")
            : "Outros";
          totals[cat] = (totals[cat] ?? 0) + Number(e.amount);
        }
        setCategoryData(
          Object.entries(totals).map(([name, value]) => ({ name, value })),
        );
      }

      setLoading(false);
    }

    loadDashboard();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const chartConfig = Object.fromEntries(
    categoryData.map((c, i) => [
      c.name,
      { label: c.name, color: COLORS[i % COLORS.length] },
    ]),
  );

  const balance = summary?.wife_balance_due ?? 0;

  let balanceMessage = "";
  let balanceColor = "";

  if (balance > 0) {
    balanceMessage = `Sua esposa te deve ${balance.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}`;
    balanceColor = "text-green-600";
  } else if (balance < 0) {
    balanceMessage = `Você deve ${Math.abs(balance).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}`;
    balanceColor = "text-red-600";
  } else {
    balanceMessage = "Tudo equilibrado";
    balanceColor = "text-muted-foreground";
  }

  const totalMonthExpenses =
    (summary?.total_joint ?? 0) +
    (summary?.total_mine ?? 0) +
    (summary?.total_hers ?? 0);

  const minePercentage =
    totalMonthExpenses > 0
      ? ((summary?.total_mine ?? 0) / totalMonthExpenses) * 100
      : 0;

  const hersPercentage =
    totalMonthExpenses > 0
      ? ((summary?.total_hers ?? 0) / totalMonthExpenses) * 100
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumo financeiro do mês atual
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas compartilhadas
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* 🔥 VALOR PRINCIPAL */}
            <p className="text-2xl font-bold">
              {totalJoint.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>

            {/* 🔥 VARIAÇÃO */}
            <p
              className={`text-xs mt-1 flex items-center gap-1 ${
                variation > 0
                  ? "text-red-500"
                  : variation < 0
                    ? "text-green-600"
                    : "text-muted-foreground"
              }`}
            >
              {variation > 0 && (
                <>
                  <ArrowUpRight className="w-3 h-3" />+
                  {Math.abs(difference).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}{" "}
                  (+{variation.toFixed(1)}%) vs mês passado
                </>
              )}

              {variation < 0 && (
                <>
                  <ArrowDownRight className="w-3 h-3" />-
                  {Math.abs(difference).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}{" "}
                  ({variation.toFixed(1)}%) economia 🎉
                </>
              )}

              {variation === 0 && "→ Mesmo valor do mês passado"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Situação do mês
            </CardTitle>
            <UserCheck className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-bold ${balanceColor}`}>
              {balanceMessage}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Baseado nos salários
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Seus gastos pessoais
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-xl font-bold text-blue-600">
              {(summary?.total_mine ?? 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              {minePercentage.toFixed(0)}% do total do mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Gastos pessoais dela
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-xl font-bold text-pink-600">
              {(summary?.total_hers ?? 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              {hersPercentage.toFixed(0)}% do total do mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lançamentos
            </CardTitle>
            <Receipt className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{recentExpenses.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos registros
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico por categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Gastos por categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                Nenhum gasto registrado ainda
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-48 w-full">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            )}

            <div className="mt-4 space-y-1">
              {categoryData.map((entry, index) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-muted-foreground">{entry.name}</span>
                  </div>
                  <span className="font-medium">
                    {entry.value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Últimos lançamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Últimos lançamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                Nenhum lançamento ainda
              </div>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-violet-100 dark:bg-violet-900 p-2 rounded-lg">
                        <Wallet className="w-3 h-3 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {expense.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {expense.categoryName} •{" "}
                          {new Date(
                            `${expense.date}T00:00:00`,
                          ).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {Number(expense.amount).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {expense.scope === "joint" ? "Conjunto" : "Individual"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
