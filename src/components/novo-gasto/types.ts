import {
  Bike,
  Book,
  BookOpen,
  Building,
  Building2,
  Cake,
  Car,
  CircleDot,
  ClipboardCheck,
  Coffee,
  Croissant,
  Cross,
  Drama,
  Droplet,
  Dumbbell,
  FileSignature,
  Film,
  Flame,
  Flower2,
  Footprints,
  Fuel,
  Gem,
  Gift,
  Glasses,
  GraduationCap,
  Hammer,
  Heart,
  Home,
  IceCream,
  Landmark,
  Mail,
  Monitor,
  MoreHorizontal,
  Package,
  ParkingCircle,
  Phone,
  Pill,
  Pizza,
  School,
  Scissors,
  Settings,
  Shield,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smile,
  Sofa,
  Sparkles,
  Stethoscope,
  Ticket,
  Trees,
  Tv,
  UtensilsCrossed,
  Wallet,
  WashingMachine,
  Watch,
  Wifi,
  Wine,
  Wrench,
  Zap,
} from "lucide-react";

export type PlaceType =
  // Moradia
  | "residencia"

  // Alimentação
  | "mercado"
  | "restaurante"
  | "lanchonete"
  | "padaria"
  | "cafeteria"
  | "confeitaria"
  | "sorveteria"
  | "bar_pub"
  | "delivery_app"

  // Saúde
  | "farmacia"
  | "consultorio"
  | "hospital_clinica"
  | "dentista"
  | "otica"
  | "academia"

  // Transporte / Veículo
  | "posto_combustivel"
  | "estacionamento"
  | "oficina"
  | "lava_jato"
  | "loja_autopecas"
  | "borracharia"
  | "vistoria"
  | "transporte_app"
  | "seguro"

  // Lazer
  | "cinema"
  | "teatro"
  | "parque"
  | "shopping"
  | "museu"
  | "livraria"

  // Educação
  | "escola"
  | "faculdade"
  | "curso"

  // Vestuário
  | "loja_roupas"
  | "loja_calcados"
  | "loja_acessorios"
  | "joalheria"

  // Pets
  | "veterinario"
  | "pet_shop"
  | "banho_tosa"

  // Beleza
  | "salao_beleza"
  | "estetica"

  // Serviços
  | "correios"
  | "cartorio"
  | "banco"
  | "loteria"
  | "lavanderia"
  | "energia"
  | "agua"
  | "gas"
  | "internet"
  | "telefonia"
  | "streaming"
  | "financeira"
  | "imobiliaria"
  | "governo"

  // Casa e Moradia
  | "mercado_construcao"
  | "loja_moveis"
  | "loja_eletronicos"
  | "assistencia_tecnica"
  | "ecommerce"

  // Outros
  | "loja_presentes"
  | "floricultora"
  | "outros";

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

export type Category = {
  id: string;
  name: string;
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
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  name: string;
};

export type Place = {
  id: string;
  name: string;
  type: PlaceType;
  created_at: string;
  is_favorite?: boolean;
  usageCount?: number;
  lastUsedAt?: string | null;
};

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
  subcategoryId?: string;
  paidById?: string;
  placeId?: string;
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
    icon: UtensilsCrossed,
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  },
  lanchonete: {
    label: "Lanchonete",
    icon: Pizza,
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },
  padaria: {
    label: "Padaria",
    icon: Croissant,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },
  cafeteria: {
    label: "Cafeteria",
    icon: Coffee,
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },
  confeitaria: {
    label: "Confeitaria",
    icon: Cake,
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  },
  sorveteria: {
    label: "Sorveteria",
    icon: IceCream,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  },
  bar_pub: {
    label: "Bar/Pub",
    icon: Wine,
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
  dentista: {
    label: "Dentista",
    icon: Smile,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  },
  otica: {
    label: "Ótica",
    icon: Glasses,
    color:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
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
  borracharia: {
    label: "Borracharia",
    icon: CircleDot,
    color: "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300",
  },
  vistoria: {
    label: "Vistoria Veicular",
    icon: ClipboardCheck,
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  },
  transporte_app: {
    label: "Transporte por App",
    icon: Car,
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  },
  seguro: {
    label: "Seguro",
    icon: Shield,
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
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
  museu: {
    label: "Museu",
    icon: Landmark,
    color: "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300",
  },
  livraria: {
    label: "Livraria",
    icon: Book,
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
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
  joalheria: {
    label: "Joalheria",
    icon: Gem,
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
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
  banho_tosa: {
    label: "Banho e Tosa",
    icon: Scissors,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  },
  salao_beleza: {
    label: "Salão de Beleza",
    icon: Scissors,
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  },
  estetica: {
    label: "Estética/Spa",
    icon: Sparkles,
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },
  correios: {
    label: "Correios",
    icon: Mail,
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },
  cartorio: {
    label: "Cartório",
    icon: FileSignature,
    color: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
  },
  banco: {
    label: "Banco/Agência",
    icon: Building,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  loteria: {
    label: "Lotérica",
    icon: Ticket,
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  lavanderia: {
    label: "Lavanderia",
    icon: WashingMachine,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  },
  mercado_construcao: {
    label: "Mercado de Construção",
    icon: Hammer,
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },
  loja_moveis: {
    label: "Loja de Móveis",
    icon: Sofa,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },
  loja_eletronicos: {
    label: "Loja de Eletrônicos",
    icon: Monitor,
    color:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  },
  assistencia_tecnica: {
    label: "Assistência Técnica",
    icon: Settings,
    color: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
  },
  loja_presentes: {
    label: "Loja de Presentes",
    icon: Gift,
    color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
  floricultora: {
    label: "Floricultura",
    icon: Flower2,
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  },
  outros: {
    label: "Outro",
    icon: MoreHorizontal,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
  },
  energia: {
    label: "Energia Elétrica",
    icon: Zap,
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },
  agua: {
    label: "Água e Esgoto",
    icon: Droplet,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  },
  gas: {
    label: "Gás",
    icon: Flame,
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
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
  streaming: {
    label: "Streaming",
    icon: Tv,
    color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
  financeira: {
    label: "Financeira",
    icon: Wallet,
    color:
      "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  },
  imobiliaria: {
    label: "Imobiliária/Aluguel",
    icon: Building,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  governo: {
    label: "Governo/Impostos",
    icon: Landmark,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
  },
  ecommerce: {
    label: "Marketplace / E-commerce",
    icon: ShoppingBag,
    color:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  },
};

export const PLACE_TYPE_GROUPS: {
  label: string;
  items: PlaceType[];
}[] = [
  {
    label: "Moradia",
    items: ["residencia", "imobiliaria"],
  },

  {
    label: "Alimentação",
    items: [
      "mercado",
      "padaria",
      "confeitaria",
      "restaurante",
      "lanchonete",
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
      "dentista",
      "otica",
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
      "borracharia",
      "vistoria",
      "transporte_app",
      "seguro",
    ],
  },

  {
    label: "Lazer e Entretenimento",
    items: [
      "cinema",
      "teatro",
      "parque",
      "shopping",
      "museu",
      "streaming",
      "livraria",
    ],
  },

  {
    label: "Educação",
    items: ["escola", "faculdade", "curso"],
  },

  {
    label: "Vestuário",
    items: ["loja_roupas", "loja_calcados", "loja_acessorios", "joalheria"],
  },

  {
    label: "Pets",
    items: ["veterinario", "pet_shop", "banho_tosa"],
  },

  {
    label: "Beleza",
    items: ["salao_beleza", "estetica"],
  },

  {
    label: "Serviços e Contas",
    items: [
      "energia",
      "agua",
      "gas",
      "internet",
      "telefonia",
      "correios",
      "cartorio",
      "loteria",
      "lavanderia",
      "governo",
    ],
  },

  {
    label: "Financeiro",
    items: ["banco", "financeira"],
  },

  {
    label: "Casa e Construção",
    items: [
      "mercado_construcao",
      "loja_moveis",
      "loja_eletronicos",
      "assistencia_tecnica",
    ],
  },
  {
    label: "Compras Online",
    items: ["ecommerce"],
  },
  {
    label: "Outros",
    items: ["loja_presentes", "floricultora", "outros"],
  },
];

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

export function getCategoryLabel(type: CategoryType): string {
  return CATEGORY_TYPE_LABELS[type] || type;
}

export function getPlaceTypeLabel(type: PlaceType): string {
  return PLACE_TYPE_CONFIG[type]?.label || type;
}

export function subcategoryRequiresPlace(subcategory: Subcategory): boolean {
  return subcategory.requires_place;
}
