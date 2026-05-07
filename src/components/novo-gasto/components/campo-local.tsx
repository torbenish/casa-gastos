"use client";

import { Loader2, MapPin, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase";
import { type Category, PLACE_TYPES, type Place } from "../types";

type Props = {
  selectedCategory: Category;
  placeSearch: string;
  setPlaceSearch: (v: string) => void;
  placeId: string;
  setPlaceId: (v: string) => void;
  allPlaces: Place[];
  setAllPlaces: (places: Place[]) => void;
};

export function CampoLocal({
  selectedCategory,
  placeSearch,
  setPlaceSearch,
  placeId,
  setPlaceId,
  allPlaces,
  setAllPlaces,
}: Props) {
  const supabase = createClient();
  const placeRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceType, setNewPlaceType] = useState(
    selectedCategory.place_type ?? "outro",
  );
  const [savingPlace, setSavingPlace] = useState(false);

  function normalizeText(text: string) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  const filteredPlaces = allPlaces
    .filter((p) => {
      const matchesType = selectedCategory.place_type
        ? p.type === selectedCategory.place_type
        : true;

      const search = normalizeText(placeSearch);

      const matchesSearch =
        search === "" ||
        search.split(" ").every((term) => normalizeText(p.name).includes(term));

      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      // ⭐ favoritos primeiro
      if ((b.is_favorite ? 1 : 0) !== (a.is_favorite ? 1 : 0)) {
        return (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0);
      }

      // 🔥 mais usados depois
      return (b.usageCount ?? 0) - (a.usageCount ?? 0);
    })
    .slice(0, 6);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (placeRef.current && !placeRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectPlace(place: Place) {
    setPlaceId(place.id);
    setPlaceSearch(place.name);
    setShowDropdown(false);
    setShowNewForm(false);
  }

  async function handleSaveNewPlace() {
    if (!newPlaceName.trim()) return;
    setSavingPlace(true);

    const { data, error } = await supabase
      .from("places")
      .insert({ name: newPlaceName.trim(), type: newPlaceType })
      .select("id, name, type")
      .single();

    if (!error && data) {
      setAllPlaces(
        [...allPlaces, data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      handleSelectPlace(data);
      setNewPlaceName("");
      setShowNewForm(false);
      toast.success("Local cadastrado!");
    }

    setSavingPlace(false);
  }

  return (
    <div className="space-y-1">
      <Label>
        Local <span className="text-muted-foreground text-xs">(opcional)</span>
      </Label>
      <div ref={placeRef} className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={placeSearch}
            onChange={(e) => {
              setPlaceSearch(e.target.value);
              setPlaceId("");
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder={
              selectedCategory.place_type
                ? `Buscar ${PLACE_TYPES[selectedCategory.place_type] ?? "local"}...`
                : "Buscar local..."
            }
            className="pl-9"
          />
          {placeSearch && (
            <button
              type="button"
              onClick={() => {
                setPlaceId("");
                setPlaceSearch("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {showDropdown && !showNewForm && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
            <div className="max-h-48 overflow-y-auto">
              {filteredPlaces.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Nenhum local encontrado
                </div>
              ) : (
                filteredPlaces.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => handleSelectPlace(place)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex flex-col">
                      <span>{place.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {PLACE_TYPES[place.type] ?? place.type}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      {place.is_favorite && "⭐"}
                      {place.usageCount ? `${place.usageCount}x` : ""}
                    </div>
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setNewPlaceName(placeSearch);
                setShowNewForm(true);
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-violet-600 hover:bg-accent border-t border-border transition-colors"
            >
              <Plus className="w-3 h-3" />
              Cadastrar novo local
            </button>
          </div>
        )}
      </div>

      {showNewForm && (
        <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/30 mt-2">
          <p className="text-xs font-medium text-muted-foreground">
            Novo local
          </p>
          <Input
            value={newPlaceName}
            onChange={(e) => setNewPlaceName(e.target.value)}
            placeholder="Nome do local"
          />
          <Select value={newPlaceType} onValueChange={setNewPlaceType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PLACE_TYPES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowNewForm(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleSaveNewPlace}
              disabled={savingPlace}
            >
              {savingPlace ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Salvar local"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
