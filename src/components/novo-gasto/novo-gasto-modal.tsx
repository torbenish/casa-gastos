"use client";

import { format } from "date-fns";
import { CalendarIcon, Copy, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampoCartao } from "./components/campo-cartao";
import { CampoLocal } from "./components/campo-local";
import { CampoProduto } from "./components/campo-produto";
import { useNovoGasto } from "./hooks/use-novo-gasto";
import {
  type Category,
  formatCurrency,
  PAYMENT_METHODS,
  parseCurrency,
} from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
};

export function NovoGastoModal({ open, onClose, onSaved, categories }: Props) {
  const g = useNovoGasto(categories, onClose, onSaved);

  const totalMarket = g.items.reduce((acc, item) => {
    if (item.measurement_type === "weight") {
      return acc + ((item.weight || 0) / 1000) * (item.price_per_kg || 0);
    }

    return acc + (item.quantity || 0) * (item.unit_price || 0);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={g.handleClose}>
      <DialogContent
        className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Novo gasto</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={g.handleDuplicateLastExpense}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 mr-6"
            >
              <Copy className="w-3 h-3" />
              Repetir último
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={g.description}
              onChange={(e) => {
                g.setDescription(e.target.value);
                g.validateField("description", e.target.value);
              }}
              onBlur={(e) => g.validateField("description", e.target.value)}
              placeholder="Ex: Conta de luz"
              className={g.fieldErrors.description ? "border-destructive" : ""}
            />
            {g.fieldErrors.description && (
              <p className="text-destructive text-xs">
                {g.fieldErrors.description}
              </p>
            )}
          </div>

          {/* Data */}
          <div className="space-y-1">
            <Label>Data *</Label>
            <Popover open={g.calendarOpen} onOpenChange={g.setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(g.selectedDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  selected={g.selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      g.setSelectedDate(date);
                      g.setCalendarOpen(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Categoria */}
          <div className="space-y-1">
            <Label>Categoria *</Label>
            <Select value={g.categoryId} onValueChange={g.handleCategoryChange}>
              <SelectTrigger
                className={g.fieldErrors.categoryId ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {g.fieldErrors.categoryId && (
              <p className="text-destructive text-xs">
                {g.fieldErrors.categoryId}
              </p>
            )}
          </div>

          {/* Local */}
          {g.selectedCategory && (
            <CampoLocal
              placeSearch={g.placeSearch}
              setPlaceSearch={g.setPlaceSearch}
              placeId={g.placeId}
              setPlaceId={g.setPlaceId}
              allPlaces={g.allPlaces}
              setAllPlaces={g.setAllPlaces}
            />
          )}

          {g.isMarketPlace && (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
                <span className="col-span-5">Produto</span>
                <span className="col-span-3 text-center">Tipo</span>
                <span className="col-span-2 text-center">Qtd/Peso</span>
                <span className="col-span-2 text-center">Preço</span>
              </div>

              {g.items.map((item, index) => (
                <div key={item.id} className="space-y-1">
                  {/* Linha principal */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    {/* Produto */}
                    <CampoProduto
                      value={item.name}
                      productId={item.product_id ?? ""}
                      onChange={(name, pid) => {
                        const updated = [...g.items];
                        updated[index].name = name;
                        updated[index].product_id = pid;
                        g.setItems(updated);
                      }}
                      placeholder="Ex: Arroz"
                      className="col-span-5"
                    />

                    {/* Tipo */}
                    <Select
                      value={item.measurement_type || "unit"}
                      onValueChange={(value) => {
                        const updated = [...g.items];
                        updated[index].measurement_type = value as
                          | "unit"
                          | "weight";
                        g.setItems(updated);
                      }}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unit">Unidade</SelectItem>
                        <SelectItem value="weight">Peso</SelectItem>
                      </SelectContent>
                    </Select>

                    {item.measurement_type === "weight" ? (
                      <>
                        {/* Peso */}
                        <div className="col-span-2 relative">
                          <Input
                            inputMode="decimal"
                            placeholder="0"
                            value={item.weight === 0 ? "" : String(item.weight)}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, "");
                              const updated = [...g.items];
                              updated[index].weight =
                                raw === "" ? 0 : Number(raw);
                              g.setItems(updated);
                            }}
                            className="pr-6 text-right"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                            g
                          </span>
                        </div>

                        {/* Preço/kg */}
                        <div className="col-span-2 relative">
                          <Input
                            inputMode="decimal"
                            placeholder="0,00"
                            value={
                              item.price_per_kg
                                ? formatCurrency(
                                    String(Math.round(item.price_per_kg * 100)),
                                  )
                                : ""
                            }
                            onChange={(e) => {
                              const formatted = formatCurrency(e.target.value);

                              const updated = [...g.items];
                              updated[index].price_per_kg =
                                parseCurrency(formatted);

                              g.setItems(updated);
                            }}
                            className="pl-7 text-right"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                            R$
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Quantidade */}
                        <div className="col-span-2">
                          <Input
                            inputMode="numeric"
                            placeholder="1"
                            value={
                              item.quantity === 0 ? "" : String(item.quantity)
                            }
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, "");
                              const updated = [...g.items];
                              updated[index].quantity =
                                raw === "" ? 0 : Number(raw);
                              g.setItems(updated);
                            }}
                            className="text-center"
                          />
                        </div>

                        {/* Valor unitário */}
                        <div className="col-span-2 relative">
                          <Input
                            inputMode="decimal"
                            placeholder="0,00"
                            value={
                              item.unit_price
                                ? formatCurrency(
                                    String(Math.round(item.unit_price * 100)),
                                  )
                                : ""
                            }
                            onChange={(e) => {
                              const formatted = formatCurrency(e.target.value);

                              const updated = [...g.items];
                              updated[index].unit_price =
                                parseCurrency(formatted);

                              g.setItems(updated);
                            }}
                            className="pl-7 text-right"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                            R$
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 🔥 TOTAL DO ITEM (AQUI) */}
                  <div className="text-right text-xs text-muted-foreground pr-1">
                    Total:{" "}
                    {(item.measurement_type === "weight"
                      ? ((item.weight || 0) / 1000) * (item.price_per_kg || 0)
                      : (item.quantity || 0) * (item.unit_price || 0)
                    ).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  g.setItems([
                    ...g.items,
                    {
                      id: crypto.randomUUID(),
                      product_id: "",
                      name: "",
                      measurement_type: "unit",
                      quantity: 1,
                      unit_price: 0,
                      weight: 0,
                      price_per_kg: 0,
                      total_price: 0,
                    },
                  ])
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar item
              </Button>
            </div>
          )}

          {!g.isMarketPlace && (
            <div className="space-y-1">
              <Label>Valor (R$) *</Label>
              <Input
                value={g.amount}
                onChange={g.handleAmountChange}
                placeholder="0,00"
              />
            </div>
          )}

          {g.isMarketPlace && (
            <div className="flex justify-between items-center py-2 border-t">
              <span>Total da compra</span>

              <span>
                {totalMarket.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
          )}

          {/* Forma de pagamento */}
          <div className="space-y-1">
            <Label>Forma de pagamento *</Label>
            <Select value={g.paymentMethod} onValueChange={g.setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cartão e parcelamento */}
          {g.needsCard && (
            <CampoCartao
              isCredit={g.isCredit}
              availableCards={g.availableCards}
              creditCardId={g.creditCardId}
              setCreditCardId={g.setCreditCardId}
              installments={g.installments}
              setInstallments={g.setInstallments}
              amount={g.amount}
              billingPreview={g.billingPreview}
            />
          )}

          {/* Tipo e Quem pagou */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tipo de gasto *</Label>
              <Select value={g.scope} onValueChange={g.setScope}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="joint">Conjunto</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Quem pagou *</Label>
              {g.isAdmin ? (
                <Select
                  value={g.paidById}
                  onValueChange={(v) => {
                    g.setPaidById(v);
                    g.validateField("paidById", v);
                  }}
                >
                  <SelectTrigger
                    className={
                      g.fieldErrors.paidById ? "border-destructive" : ""
                    }
                  >
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {g.users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={g.users[0]?.name ?? ""}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              )}
              {g.fieldErrors.paidById && (
                <p className="text-destructive text-xs">
                  {g.fieldErrors.paidById}
                </p>
              )}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Input
              id="notes"
              value={g.notes}
              onChange={(e) => g.setNotes(e.target.value)}
              placeholder="Alguma anotação..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={g.handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={g.handleSave}
              disabled={g.loading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {g.loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
