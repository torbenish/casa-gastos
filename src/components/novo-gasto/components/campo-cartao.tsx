"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreditCard } from "../types";
import { parseCurrency } from "../types";

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

type Props = {
  isCredit: boolean;
  availableCards: CreditCard[];
  creditCardId: string;
  setCreditCardId: (v: string) => void;
  installments: string;
  setInstallments: (v: string) => void;
  amount: string;
  billingPreview: { month: number; year: number } | null;
};

export function CampoCartao({
  isCredit,
  availableCards,
  creditCardId,
  setCreditCardId,
  installments,
  setInstallments,
  amount,
  billingPreview,
}: Props) {
  const numInstallments = Number(installments);
  const totalAmount = parseCurrency(amount);

  return (
    <div className="space-y-3">
      <div className={`grid gap-3 ${isCredit ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="space-y-1">
          <Label>Cartão *</Label>
          <Select value={creditCardId} onValueChange={setCreditCardId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {availableCards.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isCredit && (
          <div className="space-y-1">
            <Label>Parcelas</Label>
            <Select value={installments} onValueChange={setInstallments}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n === 1 ? "À vista" : `${n}x`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {numInstallments > 1 && totalAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                {numInstallments}x de{" "}
                {(totalAmount / numInstallments).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            )}
          </div>
        )}
      </div>

      {billingPreview && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          💳 Primeira cobrança em{" "}
          <span className="font-medium text-foreground">
            {MONTHS[billingPreview.month - 1]} {billingPreview.year}
          </span>
        </p>
      )}
    </div>
  );
}
