import {
  ShoppingCart,
  Utensils,
  Coffee,
  Store,
  IceCream,
  Beer,
  Bike,
  Pill,
  Stethoscope,
  Cross,
  FlaskConical,
  Smile,
  Dumbbell,
  Fuel,
  ParkingCircle,
  Wrench,
  Sparkles,
  Package,
  Film,
  Drama,
  Trees,
  Building2,
  School,
  GraduationCap,
  BookOpen,
  Book,
  Shirt,
  Footprints,
  Watch,
  Heart,
  ShoppingBag,
  Scissors,
  Gift,
  MoreHorizontal,
  Wallet,
  Shield,
  Zap,
  Droplet,
  Wifi,
  Phone,
  Building,
  Landmark,
  Tv,
  HeartPulse,
  Home,
} from "lucide-react";

export type CategoryType =
  | "alimentacao"
  | "moradia"
  | "transporte"
  | "veiculo"
  | "saude"
  | "lazer"
  | "educacao"
  | "vestuario"
  | "financeiro"
  | "pets"
  | "beleza"
  | "outros";

export type ScopeType = "joint" | "mine" | "hers";

export type PaymentMethod =
  | "pix"
  | "debito"
  | "dinheiro"
  | "transferencia"
  | "credito"
  | "vale_alimentacao";

// ============================================================================
// PLACE TYPES (LOCAIS FÍSICOS)
// ============================================================================

export type PlaceType =
  // Alimentação
  | "mercado"
  | "restaurante"
  | "lanchonete"
  | "padaria"
  | "cafeteria"
  | "sorveteria"
  | "bar_pub"
  | "delivery_app"

  // Saúde
  | "farmacia"
  | "consultorio"
  | "hospital_clinica"
  | "laboratorio"
  | "dentista"
  | "academia"

  // Transporte / Veículo
  | "posto_combustivel"
  | "estacionamento"
  | "oficina"
  | "lava_jato"
  | "loja_autopecas"

  // Lazer
  | "cinema"
  | "teatro"
  | "parque"
  | "shopping"

  // Educação
  | "escola"
  | "faculdade"
  | "curso"
  | "livraria"

  // Vestuário
  | "loja_roupas"
  | "loja_calcados"
  | "loja_acessorios"

  // Pets
  | "veterinario"
  | "pet_shop"

  // Beleza
  | "salao_beleza"
  | "barbearia"
  | "estetica"

  // Outros
  | "residencia"
  | "loja_presentes"
  | "outros";

// ============================================================================
// PROVIDER TYPES (EMPRESAS / INSTITUIÇÕES)
// ============================================================================

export type ProviderType =
  | "banco"
  | "financeira"
  | "seguro"
  | "energia"
  | "agua"
  | "internet"
  | "telefonia"
  | "imobiliaria"
  | "condominio"
  | "governo"
  | "streaming"
  | "educacao"
  | "saude"
  | "outros";

// ============================================================================
// DOMAIN MODELS
// ============================================================================

export type Category = {
  id: string;
  name: string;

  // manter por compatibilidade temporária
  type: CategoryType;

  category_type: CategoryType;

  default_scope: ScopeType;
};

export type Subcategory = {
  id: string;

  name: string;

  category_type: CategoryType;

  icon: React.ComponentType<{ className?: string }>;

  color: string;

  requires_place: boolean;

  requires_provider: boolean;

  created_at: string;

  updated_at: string;
};

export type User = {
  id: string;
  name: string;
};

// ============================================================================
// PLACE (LOCAL FÍSICO)
// ============================================================================

export type Place = {
  id: string;

  name: string;

  type: PlaceType;

  created_at: string;

  is_favorite?: boolean;

  usageCount?: number;

  lastUsedAt?: string | null;
};

// ============================================================================
// PROVIDER (EMPRESA / INSTITUIÇÃO)
// ============================================================================

export type Provider = {
  id: string;

  name: string;

  type: ProviderType;

  created_at: string;

  is_favorite?: boolean;

  usageCount?: number;

  lastUsedAt?: string | null;
};

// ============================================================================
// AGGREGATED TYPES
// ============================================================================

export type PlaceWithExpenses = {
  id: string;
  name: string;
  type: PlaceType;
  created_at: string;
  is_favorite: boolean;
  expenses: {
    id: string;
    created_at: string;
  }[];
};

export type ProviderWithExpenses = {
  id: string;

  name: string;

  type: ProviderType;

  is_favorite: boolean;

  expenses: {
    id: string;
  }[];
};

// ============================================================================
// CREDIT CARDS
// ============================================================================

export type CreditCard = {
  id: string;

  name: string;

  card_type: string;

  closing_day: number;

  due_day: number;
};

// ============================================================================
// FORM ERRORS
// ============================================================================

export type FieldErrors = {
  description?: string;

  amount?: string;

  subcategoryId?: string;

  paidById?: string;

  placeId?: string;

  providerId?: string;
};

// ============================================================================
// MARKET ITEMS
// ============================================================================

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

// ============================================================================
// CATEGORY LABELS
// ============================================================================

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  alimentacao: "Alimentação",
  moradia: "Moradia",
  transporte: "Transporte",
  veiculo: "Veículo",
  saude: "Saúde",
  lazer: "Lazer",
  educacao: "Educação",
  vestuario: "Vestuário",
  financeiro: "Financeiro",
  pets: "Pets",
  beleza: "Beleza",
  outros: "Outros",
};

// ============================================================================
// PLACE CONFIG
// ============================================================================

export const PLACE_TYPE_CONFIG: Record<
  PlaceType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  residencia: {
    label: "Residência",
    icon: Home,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  mercado: {
    label: "Mercado/Supermercado",
    icon: ShoppingCart,
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },

  restaurante: {
    label: "Restaurante",
    icon: Utensils,
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  },

  lanchonete: {
    label: "Lanchonete",
    icon: Coffee,
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },

  padaria: {
    label: "Padaria",
    icon: Store,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },

  cafeteria: {
    label: "Cafeteria",
    icon: Coffee,
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },

  sorveteria: {
    label: "Sorveteria",
    icon: IceCream,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  },

  bar_pub: {
    label: "Bar/Pub",
    icon: Beer,
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },

  delivery_app: {
    label: "Delivery",
    icon: Bike,
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },

  farmacia: {
    label: "Farmácia",
    icon: Pill,
    color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },

  consultorio: {
    label: "Consultório",
    icon: Stethoscope,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },

  hospital_clinica: {
    label: "Hospital/Clínica",
    icon: Cross,
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  },

  laboratorio: {
    label: "Laboratório",
    icon: FlaskConical,
    color:
      "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  },

  dentista: {
    label: "Dentista",
    icon: Smile,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  },

  academia: {
    label: "Academia",
    icon: Dumbbell,
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },

  posto_combustivel: {
    label: "Posto de Combustível",
    icon: Fuel,
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },

  estacionamento: {
    label: "Estacionamento",
    icon: ParkingCircle,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
  },

  oficina: {
    label: "Oficina Mecânica",
    icon: Wrench,
    color: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
  },

  lava_jato: {
    label: "Lava-jato",
    icon: Sparkles,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  },

  loja_autopecas: {
    label: "Loja de Autopeças",
    icon: Package,
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },

  cinema: {
    label: "Cinema",
    icon: Film,
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },

  teatro: {
    label: "Teatro",
    icon: Drama,
    color:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  },

  parque: {
    label: "Parque",
    icon: Trees,
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },

  shopping: {
    label: "Shopping",
    icon: Building2,
    color:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  },

  escola: {
    label: "Escola",
    icon: School,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },

  faculdade: {
    label: "Faculdade",
    icon: GraduationCap,
    color:
      "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  },

  curso: {
    label: "Curso",
    icon: BookOpen,
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },

  livraria: {
    label: "Livraria",
    icon: Book,
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },

  loja_roupas: {
    label: "Loja de Roupas",
    icon: Shirt,
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  },

  loja_calcados: {
    label: "Loja de Calçados",
    icon: Footprints,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },

  loja_acessorios: {
    label: "Loja de Acessórios",
    icon: Watch,
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },

  veterinario: {
    label: "Veterinário",
    icon: Heart,
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  },

  pet_shop: {
    label: "Pet Shop",
    icon: ShoppingBag,
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },

  salao_beleza: {
    label: "Salão de Beleza",
    icon: Scissors,
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  },

  barbearia: {
    label: "Barbearia",
    icon: Scissors,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },

  estetica: {
    label: "Estética/Spa",
    icon: Sparkles,
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },

  loja_presentes: {
    label: "Loja de Presentes",
    icon: Gift,
    color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },

  outros: {
    label: "Outro",
    icon: MoreHorizontal,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
  },
};

export const PLACE_TYPE_GROUPS: {
  label: string;
  items: PlaceType[];
}[] = [
  {
    label: "Moradia",
    items: ["residencia"],
  },

  {
    label: "Alimentação",
    items: [
      "mercado",
      "restaurante",
      "lanchonete",
      "padaria",
      "cafeteria",
      "sorveteria",
      "bar_pub",
      "delivery_app",
    ],
  },

  {
    label: "Saúde",
    items: [
      "farmacia",
      "consultorio",
      "hospital_clinica",
      "laboratorio",
      "dentista",
      "academia",
    ],
  },

  {
    label: "Transporte e Veículo",
    items: [
      "posto_combustivel",
      "estacionamento",
      "oficina",
      "lava_jato",
      "loja_autopecas",
    ],
  },

  {
    label: "Lazer",
    items: ["cinema", "teatro", "parque", "shopping"],
  },

  {
    label: "Educação",
    items: ["escola", "faculdade", "curso", "livraria"],
  },

  {
    label: "Vestuário",
    items: ["loja_roupas", "loja_calcados", "loja_acessorios"],
  },

  {
    label: "Pets",
    items: ["veterinario", "pet_shop"],
  },

  {
    label: "Beleza",
    items: ["salao_beleza", "barbearia", "estetica"],
  },

  {
    label: "Outros",
    items: ["loja_presentes", "outros"],
  },
];

// ============================================================================
// PROVIDER CONFIG
// ============================================================================

export const PROVIDER_TYPE_CONFIG: Record<
  ProviderType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  banco: {
    label: "Banco",
    icon: Building2,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },

  financeira: {
    label: "Financeira",
    icon: Wallet,
    color:
      "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  },

  seguro: {
    label: "Seguradora",
    icon: Shield,
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },

  energia: {
    label: "Energia",
    icon: Zap,
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },

  agua: {
    label: "Água",
    icon: Droplet,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  },

  internet: {
    label: "Internet",
    icon: Wifi,
    color:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  },

  telefonia: {
    label: "Telefonia",
    icon: Phone,
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },

  imobiliaria: {
    label: "Imobiliária",
    icon: Building,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },

  condominio: {
    label: "Condomínio",
    icon: Building2,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  },

  governo: {
    label: "Governo",
    icon: Landmark,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
  },

  streaming: {
    label: "Streaming",
    icon: Tv,
    color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },

  educacao: {
    label: "Educação",
    icon: GraduationCap,
    color:
      "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  },

  saude: {
    label: "Saúde",
    icon: HeartPulse,
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  },

  outros: {
    label: "Outros",
    icon: MoreHorizontal,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
  },
};

// ============================================================================
// PAYMENT METHODS
// ============================================================================

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

// ============================================================================
// HELPERS
// ============================================================================

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

export function getCategoryLabel(type: CategoryType): string {
  return CATEGORY_TYPE_LABELS[type] || type;
}

export function getPlaceTypeLabel(type: PlaceType): string {
  return PLACE_TYPE_CONFIG[type]?.label || type;
}

export function getProviderTypeLabel(type: ProviderType): string {
  return PROVIDER_TYPE_CONFIG[type]?.label || type;
}

export function subcategoryRequiresPlace(subcategory: Subcategory): boolean {
  return subcategory.requires_place;
}

export function subcategoryRequiresProvider(subcategory: Subcategory): boolean {
  return subcategory.requires_provider;
}
