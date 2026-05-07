export type Category = {
  id: string;
  name: string;
  type: string;
  default_scope: string;
  place_type: string | null;
};

export type User = {
  id: string;
  name: string;
};

export type Place = {
  id: string;
  name: string;
  type: string;
  is_favorite?: boolean;
  usageCount?: number;
};

export type CreditCard = {
  id: string;
  name: string;
  card_type: string;
  closing_day: number;
  due_day: number;
};

export type FieldErrors = {
  description?: string;
  amount?: string;
  categoryId?: string;
  paidById?: string;
};

export type MarketItem = {
  id: string;
  product_id: string;
  name: string;

  measurement_type: "unit" | "weight";

  quantity?: number;
  unit_price?: number;

  weight?: number;
  price_per_kg?: number;

  total_price: number;
};

export type PlaceWithExpenses = {
  id: string;
  name: string;
  type: string;
  is_favorite: boolean;
  expenses: {
    id: string;
  }[];
};

export const PLACE_TYPES: Record<string, string> = {
  mercado: "Mercado",
  restaurante: "Restaurante",
  farmacia: "Farmácia",
  saude: "Saúde",
  combustivel: "Combustível",
  transporte: "Transporte",
  moradia: "Moradia",
  veiculo: "Veículo",
  lazer: "Lazer",
  assinaturas: "Assinaturas",
  compras: "Compras",
  educacao: "Educação",
  pets: "Pets",
  servicos_pessoais: "Serviços Pessoais",
  impostos_taxas: "Impostos/Taxas",
  outro: "Outro",
};

export const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "debito", label: "Débito" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "transferencia", label: "Transferência" },
  { value: "credito", label: "Cartão de crédito" },
  { value: "vale_alimentacao", label: "Vale alimentação" },
];

export function formatCurrency(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const number = Number.parseInt(digits, 10) / 100;
  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseCurrency(value: string): number {
  return Number.parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
}
