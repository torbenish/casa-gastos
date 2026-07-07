"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  FileDown,
  Loader2,
  Minus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { ScopeType } from "@/components/novo-gasto/types";
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

type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  scope: ScopeType;
  categoryName: string;
  paidByName: string;
};

type CategoryTotal = {
  name: string;
  total: number;
  count: number;
  pct: number;
};

type MonthPoint = {
  label: string;
  total: number;
  joint: number;
  mine: number;
  hers: number;
};

type ReportData = {
  totalJoint: number;
  totalMine: number;
  totalHers: number;
  totalAll: number;
  prevTotal: number;
  variation: number;
  categoryTotals: CategoryTotal[];
  expenses: Expense[];
  monthPoints: MonthPoint[]; // só usado no anual
  largestExpense: Expense | null;
  avgPerDay: number;
  jointCount: number;
  individualCount: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

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

const COLORS = [
  "#7c3aed",
  "#a78bfa",
  "#4f46e5",
  "#818cf8",
  "#6366f1",
  "#c4b5fd",
  "#8b5cf6",
  "#ddd6fe",
  "#6d28d9",
  "#ede9fe",
];

const scopeLabel: Record<ScopeType, string> = {
  joint: "Conjunto",
  mine: "Você",
  hers: "Cônjuge",
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: string) {
  const date = new Date(`${d}T00:00:00`);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}
// ─── Mini Bar Chart SVG ───────────────────────────────────────────────────────

function BarChart({ data }: { data: CategoryTotal[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const H = 140;
  const barW = Math.max(18, Math.min(40, Math.floor(560 / data.length) - 8));

  return (
    <div className="overflow-x-auto">
      <svg
        width={Math.max(560, data.length * (barW + 10))}
        height={H + 60}
        className="min-w-full"
      >
        <title>Gráfico de gastos por categoria</title>
        {/* Linhas de grade */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={0}
            y1={H - f * H}
            x2={data.length * (barW + 10) + 20}
            y2={H - f * H}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
        ))}

        {data.map((d, i) => {
          const h = Math.max(4, (d.total / max) * H);
          const x = i * (barW + 10) + 5;
          const color = COLORS[i % COLORS.length];

          return (
            <g key={d.name}>
              {/* Barra */}
              <rect
                x={x}
                y={H - h}
                width={barW}
                height={h}
                fill={color}
                rx={4}
                opacity={0.85}
              />
              {/* Valor no topo */}
              <text
                x={x + barW / 2}
                y={H - h - 5}
                textAnchor="middle"
                fontSize={9}
                fill="currentColor"
                opacity={0.7}
              >
                {formatBRL(d.total).replace("R$\u00a0", "R$")}
              </text>
              {/* Label embaixo */}
              <text
                x={x + barW / 2}
                y={H + 18}
                textAnchor="middle"
                fontSize={9}
                fill="currentColor"
                opacity={0.6}
              >
                {d.name.length > 10 ? `${d.name.slice(0, 9)}…` : d.name}
              </text>
              {/* % */}
              <text
                x={x + barW / 2}
                y={H + 30}
                textAnchor="middle"
                fontSize={8}
                fill={color}
                opacity={0.9}
                fontWeight="600"
              >
                {d.pct.toFixed(1)}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Line Chart SVG (para visão anual) ───────────────────────────────────────

function LineChart({ points }: { points: MonthPoint[] }) {
  if (points.length < 2) return null;

  const W = 580;
  const H = 160;
  const padX = 48;
  const padY = 16;
  const iW = W - padX * 2;
  const iH = H - padY * 2;

  const max = Math.max(...points.map((p) => p.total), 1);

  const toXY = (i: number, val: number) => ({
    x: padX + (i / (points.length - 1)) * iW,
    y: padY + (1 - val / max) * iH,
  });

  const totalPts = points.map((p, i) => toXY(i, p.total));
  const toPath = (pts: { x: number; y: number }[]) =>
    pts
      .map(
        (p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
      )
      .join(" ");

  const areaPath =
    toPath(totalPts) +
    ` L ${totalPts[totalPts.length - 1].x.toFixed(1)} ${(padY + iH).toFixed(1)}` +
    ` L ${totalPts[0].x.toFixed(1)} ${(padY + iH).toFixed(1)} Z`;

  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H + 40} className="min-w-full">
        <title>Evolução mensal de gastos</title>
        {/* Área preenchida */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Linha principal */}
        <path
          d={toPath(totalPts)}
          fill="none"
          stroke="#7c3aed"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pontos + labels */}
        {totalPts.map((pt, i) => (
          <g key={points[i].label}>
            <circle cx={pt.x} cy={pt.y} r={3.5} fill="#7c3aed" />
            {/* Valor */}
            <text
              x={pt.x}
              y={pt.y - 9}
              textAnchor="middle"
              fontSize={8}
              fill="currentColor"
              opacity={0.65}
            >
              {formatBRL(points[i].total).replace("R$\u00a0", "R$")}
            </text>
            {/* Mês */}
            <text
              x={pt.x}
              y={H + 10}
              textAnchor="middle"
              fontSize={9}
              fill="currentColor"
              opacity={0.55}
            >
              {points[i].label}
            </text>
          </g>
        ))}

        {/* Eixo Y labels */}
        {[0, 0.5, 1].map((f) => (
          <text
            key={f}
            x={padX - 6}
            y={padY + (1 - f) * iH + 4}
            textAnchor="end"
            fontSize={8}
            fill="currentColor"
            opacity={0.4}
          >
            {formatBRL(f * max).replace("R$\u00a0", "R$")}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  variation,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  variation?: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card
      className={highlight ? "border-violet-300 dark:border-violet-700" : ""}
    >
      <CardHeader className="pb-1 pt-4 px-4 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-xs text-muted-foreground font-medium">
          {label}
        </CardTitle>
        <div
          className={`p-1.5 rounded-lg ${highlight ? "bg-violet-100 dark:bg-violet-900" : "bg-muted"}`}
        >
          <div
            className={highlight ? "text-violet-600" : "text-muted-foreground"}
          >
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        {variation !== undefined && variation !== 0 && (
          <p
            className={`text-xs flex items-center gap-0.5 mt-1 font-medium ${variation > 0 ? "text-red-500" : "text-green-600"}`}
          >
            {variation > 0 ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(variation).toFixed(1)}% vs período anterior
          </p>
        )}
        {variation === 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-1">
            <Minus className="w-3 h-3" />
            Igual ao período anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── PDF Generator ────────────────────────────────────────────────────────────

async function generatePDF(
  data: ReportData,
  mode: "monthly" | "annual",
  periodLabel: string,
) {
  // Carrega jsPDF dinamicamente
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210;
  const margin = 16;
  let y = 0;

  // Paleta
  const violet = [124, 58, 237] as [number, number, number];
  const dark = [15, 10, 30] as [number, number, number];
  const gray = [100, 100, 120] as [number, number, number];
  const light = [245, 243, 255] as [number, number, number];

  // ── Header com fundo ──
  doc.setFillColor(...violet);
  doc.rect(0, 0, W, 38, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório Financeiro", margin, 16);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(periodLabel, margin, 24);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`,
    margin,
    31,
  );

  y = 48;

  // ── KPIs ──
  doc.setFillColor(...light);
  doc.roundedRect(margin, y, W - margin * 2, 36, 3, 3, "F");

  const kpis = [
    { label: "Total gasto", value: formatBRL(data.totalAll) },
    { label: "Conjunto", value: formatBRL(data.totalJoint) },
    { label: "Você", value: formatBRL(data.totalMine) },
    { label: "Cônjuge", value: formatBRL(data.totalHers) },
  ];

  kpis.forEach((kpi, i) => {
    const x = margin + i * ((W - margin * 2) / 4) + 4;
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.setFont("helvetica", "normal");
    doc.text(kpi.label, x, y + 10);

    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.text(kpi.value, x, y + 20);

    if (i === 0 && data.variation !== 0) {
      const varColor: [number, number, number] =
        data.variation > 0 ? [220, 38, 38] : [22, 163, 74];
      doc.setFontSize(7);
      doc.setTextColor(...varColor);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${data.variation > 0 ? "+" : ""}${data.variation.toFixed(1)}% vs anterior`,
        x,
        y + 28,
      );
    }
  });

  y += 46;

  // ── Seção: Por Categoria ──
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.text("Gastos por Categoria", margin, y);
  y += 6;

  doc.setDrawColor(230, 225, 255);
  doc.line(margin, y, W - margin, y);
  y += 5;

  data.categoryTotals.forEach((cat, i) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    const barMaxW = W - margin * 2 - 60;
    const barW = (cat.pct / 100) * barMaxW;
    const color = COLORS[i % COLORS.length];
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;

    doc.setFillColor(r, g, b);
    doc.roundedRect(margin, y, Math.max(barW, 2), 5, 1, 1, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...dark);
    doc.text(cat.name, margin, y - 1);

    doc.setTextColor(...gray);
    doc.text(`${cat.pct.toFixed(1)}%`, W - margin - 42, y + 3.5, {
      align: "right",
    });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dark);
    doc.text(formatBRL(cat.total), W - margin, y + 3.5, { align: "right" });

    y += 12;
  });

  y += 4;

  // ── Seção: Linha do tempo (anual) ──
  if (mode === "annual" && data.monthPoints.length > 0) {
    if (y > 200) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dark);
    doc.text("Evolução Mensal", margin, y);
    y += 6;
    doc.setDrawColor(230, 225, 255);
    doc.line(margin, y, W - margin, y);
    y += 8;

    const pts = data.monthPoints;
    const maxV = Math.max(...pts.map((p) => p.total), 1);
    const chartH = 35;
    const chartW = W - margin * 2;

    pts.forEach((pt, i) => {
      const x = margin + (i / (pts.length - 1)) * chartW;
      const h = (pt.total / maxV) * chartH;

      doc.setFillColor(...violet);
      doc.roundedRect(x - 4, y + chartH - h, 8, h, 1, 1, "F");

      doc.setFontSize(6);
      doc.setTextColor(...gray);
      doc.text(pt.label.slice(0, 3), x, y + chartH + 5, { align: "center" });
    });

    y += chartH + 12;
  }

  // ── Seção: Maiores gastos ──
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.text("Lançamentos do Período", margin, y);
  y += 6;
  doc.setDrawColor(230, 225, 255);
  doc.line(margin, y, W - margin, y);
  y += 6;

  // Cabeçalho da tabela
  doc.setFillColor(...violet);
  doc.rect(margin, y, W - margin * 2, 7, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Data", margin + 2, y + 4.5);
  doc.text("Descrição", margin + 22, y + 4.5);
  doc.text("Categoria", margin + 90, y + 4.5);
  doc.text("Tipo", margin + 130, y + 4.5);
  doc.text("Valor", W - margin - 2, y + 4.5, { align: "right" });
  y += 9;

  const topExpenses = [...data.expenses].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  topExpenses.forEach((exp, i) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    if (i % 2 === 0) {
      doc.setFillColor(248, 246, 255);
      doc.rect(margin, y - 1, W - margin * 2, 7, "F");
    }

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...dark);

    doc.text(formatDate(exp.date), margin + 2, y + 3.5);

    const desc =
      exp.description.length > 32
        ? `${exp.description.slice(0, 31)}…`
        : exp.description;
    doc.text(desc, margin + 22, y + 3.5);

    const cat =
      exp.categoryName.length > 18
        ? `${exp.categoryName.slice(0, 17)}…`
        : exp.categoryName;
    doc.text(cat, margin + 90, y + 3.5);

    doc.text(scopeLabel[exp.scope] ?? exp.scope, margin + 130, y + 3.5);

    doc.setFont("helvetica", "bold");
    doc.text(formatBRL(exp.amount), W - margin - 2, y + 3.5, {
      align: "right",
    });

    y += 7;
  });

  // ── Rodapé ──
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gray);
    doc.text(
      `Casa Gastos · ${periodLabel} · Página ${p} de ${pageCount}`,
      W / 2,
      290,
      { align: "center" },
    );
  }

  const filename = `relatorio-${periodLabel.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  doc.save(filename);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const now = new Date();
  const [mode, setMode] = useState<"monthly" | "annual">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(
    String(now.getMonth() + 1),
  );
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const supabase = createClient();

  const years = useMemo(() => {
    const y = [];
    for (let i = now.getFullYear(); i >= now.getFullYear() - 4; i--)
      y.push(String(i));
    return y;
  }, [now]);

  const periodLabel = useMemo(() => {
    if (mode === "monthly") {
      return `${MONTHS[Number(selectedMonth) - 1]} ${selectedYear}`;
    }
    return `Ano ${selectedYear}`;
  }, [mode, selectedMonth, selectedYear]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setData(null);

    try {
      const year = Number(selectedYear);
      const month = Number(selectedMonth);

      // ── Datas do período atual ──
      const startDate =
        mode === "monthly"
          ? `${year}-${String(month).padStart(2, "0")}-01`
          : `${year}-01-01`;
      const endDate =
        mode === "monthly"
          ? month === 12
            ? `${year + 1}-01-01`
            : `${year}-${String(month + 1).padStart(2, "0")}-01`
          : `${year + 1}-01-01`;

      // ── Datas do período anterior ──
      const prevStartDate =
        mode === "monthly"
          ? month === 1
            ? `${year - 1}-12-01`
            : `${year}-${String(month - 1).padStart(2, "0")}-01`
          : `${year - 1}-01-01`;
      const prevEndDate = mode === "monthly" ? startDate : `${year}-01-01`;

      // Busca em paralelo
      const [expensesRes, prevRes, catsRes, usersRes] = await Promise.all([
        supabase
          .from("expenses")
          .select("id, description, amount, date, scope, category_id, paid_by")
          .gte("date", startDate)
          .lt("date", endDate)
          .order("date", { ascending: false }),
        supabase
          .from("expenses")
          .select("amount")
          .gte("date", prevStartDate)
          .lt("date", prevEndDate),
        supabase.from("categories").select("id, name"),
        supabase.from("users").select("id, name"),
      ]);

      const expenses = expensesRes.data ?? [];
      const prevExpenses = prevRes.data ?? [];
      const cats = Object.fromEntries(
        (catsRes.data ?? []).map((c) => [c.id, c.name]),
      );
      const users = Object.fromEntries(
        (usersRes.data ?? []).map((u) => [u.id, u.name]),
      );

      // Enriquece expenses
      const enriched: Expense[] = expenses.map((e) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount),
        date: e.date,
        scope: e.scope,
        categoryName: e.category_id
          ? (cats[e.category_id] ?? "Sem categoria")
          : "Sem categoria",
        paidByName: e.paid_by ? (users[e.paid_by] ?? "—") : "—",
      }));

      // Totais
      const totalAll = enriched.reduce((a, e) => a + e.amount, 0);
      const totalJoint = enriched
        .filter((e) => e.scope === "joint")
        .reduce((a, e) => a + e.amount, 0);
      const totalMine = enriched
        .filter((e) => e.scope === "mine")
        .reduce((a, e) => a + e.amount, 0);
      const totalHers = enriched
        .filter((e) => e.scope === "hers")
        .reduce((a, e) => a + e.amount, 0);

      const prevTotal = prevExpenses.reduce((a, e) => a + Number(e.amount), 0);
      const variation =
        prevTotal > 0 ? ((totalAll - prevTotal) / prevTotal) * 100 : 0;

      // Por categoria
      const catTotals: Record<string, { total: number; count: number }> = {};
      for (const e of enriched) {
        if (!catTotals[e.categoryName])
          catTotals[e.categoryName] = { total: 0, count: 0 };
        catTotals[e.categoryName].total += e.amount;
        catTotals[e.categoryName].count += 1;
      }
      const categoryTotals: CategoryTotal[] = Object.entries(catTotals)
        .map(([name, v]) => ({
          name,
          ...v,
          pct: totalAll > 0 ? (v.total / totalAll) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);

      // Pontos mensais (só anual)
      const monthPoints: MonthPoint[] = [];
      if (mode === "annual") {
        for (let m = 1; m <= 12; m++) {
          const ms = `${year}-${String(m).padStart(2, "0")}-01`;
          const me =
            m === 12
              ? `${year + 1}-01-01`
              : `${year}-${String(m + 1).padStart(2, "0")}-01`;
          const mExpenses = enriched.filter((e) => e.date >= ms && e.date < me);
          monthPoints.push({
            label: MONTHS[m - 1].slice(0, 3),
            total: mExpenses.reduce((a, e) => a + e.amount, 0),
            joint: mExpenses
              .filter((e) => e.scope === "joint")
              .reduce((a, e) => a + e.amount, 0),
            mine: mExpenses
              .filter((e) => e.scope === "mine")
              .reduce((a, e) => a + e.amount, 0),
            hers: mExpenses
              .filter((e) => e.scope === "hers")
              .reduce((a, e) => a + e.amount, 0),
          });
        }
      }

      // Dias no período
      const msPerDay = 86400000;
      const days = Math.max(
        1,
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          msPerDay,
      );

      const largestExpense =
        enriched.length > 0
          ? enriched.reduce((a, b) => (b.amount > a.amount ? b : a))
          : null;

      setData({
        totalAll,
        totalJoint,
        totalMine,
        totalHers,
        prevTotal,
        variation,
        categoryTotals,
        expenses: enriched,
        monthPoints,
        largestExpense,
        avgPerDay: totalAll / days,
        jointCount: enriched.filter((e) => e.scope === "joint").length,
        individualCount: enriched.filter((e) => e.scope !== "joint").length,
      });
    } catch (error) {
      console.error(error);

      toast.error("Erro ao carregar relatório.");
    } finally {
      setLoading(false);
    }
  }, [supabase, mode, selectedMonth, selectedYear]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  async function handleExportPDF() {
    if (!data) return;

    setExporting(true);

    try {
      await generatePDF(data, mode, periodLabel);

      toast.success("PDF gerado com sucesso!");
    } catch (e) {
      console.error(e);

      toast.error("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Análise detalhada dos seus gastos por período
          </p>
        </div>

        <Button
          type="button"
          onClick={handleExportPDF}
          disabled={!data || exporting || loading}
          className="bg-violet-600 hover:bg-violet-700 text-white shrink-0"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4 mr-2" />
              Exportar PDF
            </>
          )}
        </Button>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Toggle modo */}
        <div className="flex border rounded-lg overflow-hidden">
          {(["monthly", "annual"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === m
                  ? "bg-violet-600 text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {m === "monthly" ? "Mensal" : "Anual"}
            </button>
          ))}
        </div>

        {mode === "monthly" && (
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Label do período */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 dark:bg-violet-950 rounded-lg border border-violet-200 dark:border-violet-800">
          <Calendar className="w-3.5 h-3.5 text-violet-600" />
          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
            {periodLabel}
          </span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Carregando relatório...
        </div>
      )}

      {/* Conteúdo */}
      {!loading && data && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="Total do período"
              value={formatBRL(data.totalAll)}
              variation={data.variation}
              icon={<BarChart3 className="w-4 h-4" />}
              highlight
            />
            <KpiCard
              label="Gastos conjuntos"
              value={formatBRL(data.totalJoint)}
              sub={`${data.jointCount} lançamento${data.jointCount !== 1 ? "s" : ""}`}
              icon={<Users className="w-4 h-4" />}
            />
            <KpiCard
              label="Você gastou"
              value={formatBRL(data.totalMine)}
              icon={<Wallet className="w-4 h-4" />}
            />
            <KpiCard
              label="Cônjuge gastou"
              value={formatBRL(data.totalHers)}
              icon={<Wallet className="w-4 h-4" />}
            />
          </div>

          {/* Stats secundários */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Média por dia</p>
              <p className="text-xl font-bold mt-1">
                {formatBRL(data.avgPerDay)}
              </p>
            </div>
            <div className="border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">
                Total de lançamentos
              </p>
              <p className="text-xl font-bold mt-1">{data.expenses.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {data.jointCount} conjuntos · {data.individualCount} individuais
              </p>
            </div>
            {data.largestExpense && (
              <div className="border rounded-xl p-4">
                <p className="text-xs text-muted-foreground">Maior gasto</p>
                <p className="text-xl font-bold mt-1">
                  {formatBRL(data.largestExpense.amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {data.largestExpense.description}
                </p>
              </div>
            )}
          </div>

          {/* Comparação vs período anterior */}
          {data.prevTotal > 0 && (
            <div
              className={`rounded-xl border p-4 flex items-center gap-4 ${
                data.variation > 0
                  ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900"
                  : data.variation < 0
                    ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900"
                    : "bg-muted border-border"
              }`}
            >
              <div
                className={`p-2.5 rounded-lg shrink-0 ${
                  data.variation > 0
                    ? "bg-red-100 dark:bg-red-900"
                    : data.variation < 0
                      ? "bg-green-100 dark:bg-green-900"
                      : "bg-muted"
                }`}
              >
                {data.variation > 0 ? (
                  <TrendingUp className="w-5 h-5 text-red-500" />
                ) : data.variation < 0 ? (
                  <TrendingDown className="w-5 h-5 text-green-600" />
                ) : (
                  <Minus className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {data.variation > 0
                    ? `Gastos ${Math.abs(data.variation).toFixed(1)}% maiores que o período anterior`
                    : data.variation < 0
                      ? `Economia de ${Math.abs(data.variation).toFixed(1)}% em relação ao período anterior 🎉`
                      : "Mesmo valor do período anterior"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Período anterior:{" "}
                  <span className="font-medium text-foreground">
                    {formatBRL(data.prevTotal)}
                  </span>
                  {" · "}Diferença:{" "}
                  <span
                    className={`font-medium ${data.variation > 0 ? "text-red-500" : "text-green-600"}`}
                  >
                    {data.variation > 0 ? "+" : ""}
                    {formatBRL(data.totalAll - data.prevTotal)}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Gráfico de categorias */}
          {data.categoryTotals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-violet-600" />
                  Gastos por categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={data.categoryTotals} />

                {/* Legenda */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4 pt-4 border-t">
                  {data.categoryTotals.map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs truncate">{cat.name}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {formatBRL(cat.total)}{" "}
                          <span className="text-violet-600">
                            ·{cat.pct.toFixed(1)}%
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de linha — só anual */}
          {mode === "annual" && data.monthPoints.some((p) => p.total > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-violet-600" />
                  Evolução mensal — {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart points={data.monthPoints} />

                {/* Resumo por mês */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4 pt-4 border-t">
                  {data.monthPoints
                    .filter((p) => p.total > 0)
                    .map((p) => (
                      <div key={p.label} className="text-center">
                        <p className="text-xs text-muted-foreground">
                          {p.label}
                        </p>
                        <p className="text-xs font-semibold tabular-nums mt-0.5">
                          {formatBRL(p.total)}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela de lançamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="w-4 h-4 text-violet-600" />
                Todos os lançamentos
                <Badge variant="outline" className="ml-1 text-xs">
                  {data.expenses.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {data.expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <Receipt className="w-8 h-8 opacity-30" />
                  <p className="text-sm">Nenhum lançamento neste período</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Pago por</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right pr-6">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.expenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell className="pl-6 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(exp.date)}
                        </TableCell>
                        <TableCell className="font-medium text-sm max-w-[200px] truncate">
                          {exp.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {exp.categoryName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {exp.scope === "mine"
                              ? "👤 Você"
                              : exp.scope === "hers"
                                ? "👤 Cônjuge"
                                : `👥 ${exp.paidByName}`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              exp.scope === "joint"
                                ? "text-violet-700 border-violet-300 bg-violet-50 dark:bg-violet-950 dark:border-violet-700"
                                : exp.scope === "mine"
                                  ? "text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-700"
                                  : "text-pink-700 border-pink-300 bg-pink-50 dark:bg-pink-950 dark:border-pink-700"
                            }`}
                          >
                            {scopeLabel[exp.scope]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 font-semibold tabular-nums">
                          {formatBRL(exp.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vazio */}
      {!loading && data && data.expenses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <div className="bg-muted rounded-full p-4">
            <BarChart3 className="w-6 h-6 opacity-50" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Sem dados para este período</p>
            <p className="text-xs mt-1 opacity-70">
              Selecione outro mês ou ano para visualizar o relatório
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
