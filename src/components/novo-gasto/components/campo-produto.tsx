"use client";

import { Check, Loader2, Package, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  category?: string | null;
};

type Props = {
  value: string; // nome digitado / selecionado
  productId: string; // id do produto selecionado (vazio se novo)
  onChange: (name: string, productId: string) => void;
  placeholder?: string;
  className?: string;
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function CampoProduto({
  value,
  productId,
  onChange,
  placeholder = "Ex: Arroz",
  className = "",
}: Props) {
  const supabase = createClient();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(value);
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);
  const [selected, setSelected] = useState(!!productId);

  // Carrega todos os produtos uma única vez
  useEffect(() => {
    async function load() {
      setLoadingProducts(true);
      const { data } = await supabase
        .from("products")
        .select("id, name, category")
        .order("name");
      if (data) setProducts(data);
      setLoadingProducts(false);
    }
    load();
  }, [supabase]);

  // Filtra conforme o usuário digita
  useEffect(() => {
    if (!query.trim()) {
      setFiltered(products.slice(0, 8));
      return;
    }
    const q = normalize(query);
    setFiltered(
      products.filter((p) => normalize(p.name).includes(q)).slice(0, 8),
    );
  }, [query, products]);

  // Sincroniza prop value → estado interno quando o item é resetado externamente
  useEffect(() => {
    setQuery(value);
    setSelected(!!productId);
  }, [value, productId]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setShowNewForm(false);
        // Se o usuário digitou algo mas não selecionou nenhum produto existente,
        // mantém o texto para permitir cadastro posterior, mas limpa o productId
        if (!selected && query.trim()) {
          onChange(query.trim(), "");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected, query, onChange]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    setSelected(false);
    onChange(v, ""); // productId vazio enquanto não seleciona
    setShowDropdown(true);
    setShowNewForm(false);
  }

  function handleSelect(product: Product) {
    setQuery(product.name);
    setSelected(true);
    onChange(product.name, product.id);
    setShowDropdown(false);
    setShowNewForm(false);
  }

  function handleClear() {
    setQuery("");
    setSelected(false);
    onChange("", "");
    setShowDropdown(false);
    setShowNewForm(false);
  }

  async function handleSaveNewProduct() {
    const name = newProductName.trim() || query.trim();
    if (!name) return;
    setSavingProduct(true);

    // Verifica se já existe (case-insensitive)
    const { data: existing } = await supabase
      .from("products")
      .select("id, name")
      .ilike("name", name)
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Já existe — apenas seleciona
      setProducts((prev) =>
        prev.some((p) => p.id === existing.id) ? prev : [...prev, existing],
      );
      handleSelect(existing);
      toast.info("Produto já cadastrado — selecionado automaticamente.");
    } else {
      const { data: created, error } = await supabase
        .from("products")
        .insert({ name })
        .select("id, name, category")
        .single();

      if (!error && created) {
        setProducts((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
        handleSelect(created);
        toast.success("Produto cadastrado!");
      } else {
        toast.error("Erro ao cadastrar produto.");
      }
    }

    setNewProductName("");
    setShowNewForm(false);
    setSavingProduct(false);
  }

  const exactMatch = products.some(
    (p) => normalize(p.name) === normalize(query),
  );

  const showAddOption = query.trim() && !exactMatch && !selected;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Input principal */}
      <div className="relative">
        {loadingProducts ? (
          <Loader2 className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground animate-spin" />
        ) : (
          <Package className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        )}
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className={`pl-6 pr-6 text-sm ${selected ? "border-green-500 dark:border-green-600" : ""}`}
        />
        {/* Indicador de selecionado ou botão limpar */}
        {selected && (
          <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-green-500 pointer-events-none" />
        )}
        {query && !selected && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Dropdown de sugestões */}
      {showDropdown && !showNewForm && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 && !showAddOption ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Nenhum produto encontrado
              </div>
            ) : (
              filtered.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelect(product)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-accent transition-colors text-left"
                >
                  <span className="font-medium">{product.name}</span>
                  {product.category && (
                    <span className="text-muted-foreground text-[10px]">
                      {product.category}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Opção de cadastrar novo */}
          {showAddOption && (
            <button
              type="button"
              onClick={() => {
                setNewProductName(query);
                setShowNewForm(true);
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-violet-600 hover:bg-accent border-t border-border transition-colors"
            >
              <Plus className="w-3 h-3" />
              Cadastrar "{query}" como novo produto
            </button>
          )}
        </div>
      )}

      {/* Mini-formulário de novo produto */}
      {showNewForm && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Novo produto
          </p>
          <Input
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            placeholder="Nome do produto"
            className="text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveNewProduct();
              if (e.key === "Escape") setShowNewForm(false);
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                setShowNewForm(false);
                setShowDropdown(true);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-xs"
              onClick={handleSaveNewProduct}
              disabled={savingProduct || !newProductName.trim()}
            >
              {savingProduct ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Salvar produto"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
