"use client";

import {
  MapPin,
  Pencil,
  Plus,
  Search,
  Settings,
  Star,
  Store,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase";
import {
  PLACE_TYPE_CONFIG,
  PLACE_TYPE_GROUPS,
  PlaceWithExpenses,
  type Place,
  type PlaceType,
} from "@/components/novo-gasto/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "locais";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getPlaceTypeInfo(type: PlaceType) {
  return PLACE_TYPE_CONFIG[type] ?? PLACE_TYPE_CONFIG.outros;
}

// ─── Modal de criar/editar local ─────────────────────────────────────────────

type PlaceModalProps = {
  open: boolean;
  place: Place | null;
  places: Place[];
  onClose: () => void;
  onSaved: () => void;
};

function PlaceModal({
  open,
  place,
  places,
  onClose,
  onSaved,
}: PlaceModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<PlaceType | "">("");
  const [group, setGroup] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      setName(place?.name ?? "");

      const currentType = (place?.type as PlaceType) ?? "outros";

      setType(currentType);

      const foundGroup = PLACE_TYPE_GROUPS.find((group) =>
        group.items.includes(currentType),
      );

      setGroup(foundGroup?.label ?? "");
    }
  }, [open, place]);

  const availableTypes =
    PLACE_TYPE_GROUPS.find((g) => g.label === group)?.items ?? [];

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Informe o nome do local");
      return;
    }

    const normalizedName = normalizeText(name);

    const duplicate = places.find((p) => {
      if (place && p.id === place.id) return false;
      return normalizeText(p.name) === normalizedName;
    });

    if (duplicate) {
      toast.error(`Já existe um local com nome parecido: "${duplicate.name}"`);
      return;
    }

    setSaving(true);

    if (place) {
      // Editar
      const { error } = await supabase
        .from("places")
        .update({ name: name.trim(), type })
        .eq("id", place.id);

      if (error) {
        toast.error("Erro ao atualizar local");
      } else {
        toast.success("Local atualizado!");
        onSaved();
        onClose();
      }
    } else {
      // Criar
      const { error } = await supabase
        .from("places")
        .insert({ name: name.trim(), type });

      if (error) {
        toast.error("Erro ao cadastrar local");
      } else {
        toast.success("Local cadastrado!");
        onSaved();
        onClose();
      }
    }

    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-violet-600" />
            {place ? "Editar local" : "Novo local"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="place-name">Nome do local *</Label>
            <Input
              id="place-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Assaí Atacadista"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <div className="space-y-1.5">
              <Label>Grupo do local *</Label>

              <Select
                value={group}
                onValueChange={(value) => {
                  setGroup(value);
                  setType("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>

                <SelectContent>
                  {PLACE_TYPE_GROUPS.map((group) => (
                    <SelectItem key={group.label} value={group.label}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Label>Tipo do local *</Label>
            <Select
              value={type || undefined}
              onValueChange={(value) => setType(value as PlaceType)}
              disabled={!group}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    group ? "Selecione o tipo" : "Escolha primeiro um grupo"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((item) => {
                  const config = PLACE_TYPE_CONFIG[item];
                  const Icon = config.icon;

                  return (
                    <SelectItem key={item} value={item}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {type && (
              <div className="flex items-center gap-2 pt-1">
                <p className="text-xs text-muted-foreground">Aparecerá como:</p>

                <Badge
                  variant="outline"
                  className={`text-xs ${getPlaceTypeInfo(type).color}`}
                >
                  {getPlaceTypeInfo(type).label}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {saving ? "Salvando..." : place ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Seção de Locais ──────────────────────────────────────────────────────────

function LocalesSection() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<PlaceType | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [deletingPlace, setDeletingPlace] = useState<Place | null>(null);
  const [sortBy, setSortBy] = useState("name");
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("places")
      .select(`
    id,
    name,
    type,
    created_at,
    is_favorite,
    expenses (id, created_at)
  `)
      .order("name");
    if (data) {
      const typedData = data as PlaceWithExpenses[];
      const enriched: Place[] = typedData.map((place) => {
        const expenses = place.expenses ?? [];

        const sortedExpenses = [...expenses].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        return {
          ...place,
          usageCount: expenses.length,
          lastUsedAt: sortedExpenses[0]?.created_at ?? null,
        };
      });

      setPlaces(enriched);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(place: Place) {
    const { error } = await supabase.from("places").delete().eq("id", place.id);

    if (error) {
      toast.error("Erro ao excluir. Este local pode estar em uso em gastos.");
    } else {
      toast.success("Local excluído");
      load();
    }
    setDeletingPlace(null);
  }

  async function toggleFavorite(place: Place) {
    const newValue = !place.is_favorite;

    // ✅ Atualiza UI imediatamente
    setPlaces((prev) =>
      prev.map((p) =>
        p.id === place.id ? { ...p, is_favorite: newValue } : p,
      ),
    );

    // 🔁 Persiste no backend
    const { error } = await supabase
      .from("places")
      .update({ is_favorite: newValue })
      .eq("id", place.id);

    // ❌ Se der erro, desfaz
    if (error) {
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === place.id ? { ...p, is_favorite: !newValue } : p,
        ),
      );

      toast.error("Erro ao favoritar");
    }
  }

  const filtered = places.filter((p) => {
    const normalizedSearch = normalizeText(search);

    const matchSearch = normalizedSearch
      .split(" ")
      .every((term) => normalizeText(p.name).includes(term));

    const matchType = filterType === "all" || p.type === filterType;

    return matchSearch && matchType;
  });

  const sorted = [...filtered].sort((a, b) => {
    if ((b.is_favorite ? 1 : 0) !== (a.is_favorite ? 1 : 0)) {
      return (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0);
    }

    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }

    if (sortBy === "recent") {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    if (sortBy === "usage") {
      return (b.usageCount ?? 0) - (a.usageCount ?? 0);
    }

    return 0;
  });

  const grouped = PLACE_TYPE_GROUPS.map((group) => ({
    ...group,

    places: sorted.filter((p) => group.items.includes(p.type)),
  })).filter((group) => group.places.length > 0);

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar local..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={filterType}
          onValueChange={(value) => setFilterType(value as PlaceType | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <div className="my-1 border-t" />
            {PLACE_TYPE_GROUPS.map((group) => (
              <div key={group.label} className="py-1">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {group.label}
                </div>

                {group.items.map((item) => {
                  const config = PLACE_TYPE_CONFIG[item];

                  return (
                    <SelectItem key={item} value={item}>
                      {config.label}
                    </SelectItem>
                  );
                })}
              </div>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nome (A-Z)</SelectItem>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="usage">Mais usados</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          onClick={() => {
            setEditingPlace(null);
            setModalOpen(true);
          }}
          className="bg-violet-600 hover:bg-violet-700 text-white shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo local
        </Button>
      </div>

      {/* Contagem */}
      {!loading && (
        <p className="text-xs text-muted-foreground mb-4">
          {filtered.length} local{filtered.length !== 1 ? "is" : ""} encontrado
          {filtered.length !== 1 ? "s" : ""}
          {filterType !== "all" &&
            ` em ${getPlaceTypeInfo(filterType as PlaceType).label}`}
        </p>
      )}

      {/* Lista agrupada */}
      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground text-sm">
          Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <div className="bg-muted rounded-full p-4">
            <Store className="w-6 h-6 opacity-50" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Nenhum local encontrado</p>
            <p className="text-xs mt-1 opacity-70">
              {search
                ? "Tente buscar por outro nome"
                : 'Clique em "Novo local" para cadastrar'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => {
            const firstType = group.items[0] as PlaceType;

            const groupConfig = PLACE_TYPE_CONFIG[firstType];

            const Icon = groupConfig.icon;
            return (
              <div key={group.label}>
                {/* Header do grupo */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${groupConfig.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-sm font-semibold">{group.label}</p>
                  <span className="text-xs text-muted-foreground">
                    ({group.places.length})
                  </span>
                </div>

                {/* Cards do grupo */}
                <div className="space-y-1 pl-1">
                  {group.places.map((place) => (
                    <div
                      key={place.id}
                      className="flex items-center justify-between py-3 px-4 rounded-xl border hover:border-violet-200 dark:hover:border-violet-800 hover:bg-muted/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg ${groupConfig.color} shrink-0`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 ${
                            place.is_favorite
                              ? "text-yellow-500"
                              : "text-muted-foreground opacity-40"
                          }`}
                          onClick={() => toggleFavorite(place)}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {place.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {place.usageCount && place.usageCount > 0
                              ? `Usado ${place.usageCount}x`
                              : "Nunca utilizado"}
                            {place.lastUsedAt &&
                              ` • Último uso: ${formatDate(place.lastUsedAt)}`}
                            {` • Cadastrado em ${formatDate(place.created_at)}`}
                          </p>
                        </div>
                      </div>

                      {/* Ações — aparecem no hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingPlace(place);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletingPlace(place)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal criar/editar */}
      <PlaceModal
        open={modalOpen}
        place={editingPlace}
        places={places}
        onClose={() => {
          setModalOpen(false);
          setEditingPlace(null);
        }}
        onSaved={load}
      />

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={!!deletingPlace}
        onOpenChange={() => setDeletingPlace(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir local</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="font-semibold text-foreground">
                {deletingPlace?.name}
              </span>
              ? Gastos associados a este local não serão afetados, mas o local
              não aparecerá mais para seleção.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPlace && handleDelete(deletingPlace)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "locais",
    label: "Locais",
    icon: <MapPin className="w-4 h-4" />,
  },
];

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("locais");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-muted p-2.5 rounded-xl">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Configurações</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gerencie locais, categorias e preferências do sistema
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as Tab)}
      >
        <TabsList className="grid w-fit grid-cols-1">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2"
            >
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Conteúdo da aba */}
      <div>{activeTab === "locais" && <LocalesSection />}</div>
    </div>
  );
}
