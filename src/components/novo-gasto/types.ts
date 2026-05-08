export type CategoryType =
  | "alimentacao"
  | "moradia"
  | "transporte"
  | "veiculo"
  | "saude"
  | "lazer"
  | "financeiro"
  | "outros";

export type PlaceType =
  | "mercado"
  | "restaurante"
  | "saude"
  | "combustivel"
  | "transporte"
  | "moradia"
  | "veiculo"
  | "lazer"
  | "outro";

export type ScopeType = "joint" | "mine" | "hers";

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  default_scope: ScopeType;
};

export type User = {
  id: string;
  name: string;
};

export type Place = {
  id: string;
  name: string;
  type: PlaceType;
  is_favorite?: boolean;
  usageCount?: number;
  lastUsedAt?: string | null;
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
  type: PlaceType;
  is_favorite: boolean;
  expenses: {
    id: string;
  }[];
};

export const PLACE_TYPES: Record<PlaceType, string> = {
  mercado: "Mercado",
  restaurante: "Restaurante",
  saude: "Saúde",
  combustivel: "Combustível",
  transporte: "Transporte",
  moradia: "Moradia",
  veiculo: "Veículo",
  lazer: "Lazer",
  outro: "Outro",
};

export type PaymentMethod =
  | "pix"
  | "debito"
  | "dinheiro"
  | "transferencia"
  | "credito"
  | "vale_alimentacao";

export const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
}[] = [
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
