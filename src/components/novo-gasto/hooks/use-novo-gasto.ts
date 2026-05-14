import { addMonths, format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import {
  type Category,
  type CreditCard,
  type FieldErrors,
  formatCurrency,
  type MarketItem,
  type Place,
  type PlaceWithExpenses,
  parseCurrency,
  type User,
} from "../types";

function getBillingMonth(purchaseDate: Date, closingDay: number) {
  const day = purchaseDate.getDate();
  if (day <= closingDay) {
    return {
      month: purchaseDate.getMonth() + 1,
      year: purchaseDate.getFullYear(),
    };
  }
  const next = addMonths(purchaseDate, 1);
  return { month: next.getMonth() + 1, year: next.getFullYear() };
}

export function useNovoGasto(
  categories: Category[],
  onClose: () => void,
  onSaved: () => void,
) {
  const supabase = createClient();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [categoryId, setCategoryId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [scope, setScope] = useState("joint");
  const [paidById, setPaidById] = useState("");
  const [notes, setNotes] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [placeSearch, setPlaceSearch] = useState("");
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [creditCardId, setCreditCardId] = useState("");
  const [installments, setInstallments] = useState("1");
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [items, setItems] = useState<MarketItem[]>([]);

  const isCredit = paymentMethod === "credito";
  const isValeAlimentacao = paymentMethod === "vale_alimentacao";
  const needsCard = isCredit || isValeAlimentacao;

  const availableCards = creditCards.filter((c) =>
    isCredit ? c.card_type === "credito" : c.card_type === "vale_alimentacao",
  );

  const selectedPlace = allPlaces.find((p) => p.id === placeId);

  const isMarketPlace = selectedPlace?.type === "mercado";

  const selectedCard = creditCards.find((c) => c.id === creditCardId);
  const billingPreview =
    needsCard && selectedCard
      ? getBillingMonth(selectedDate, selectedCard.closing_day)
      : null;

  useEffect(() => {
    async function loadInitialData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("id, name, role")
        .eq("auth_id", user.id)
        .single();

      if (!profile) return;

      setCurrentUserId(profile.id);
      setIsAdmin(profile.role === "admin");

      if (profile.role === "admin") {
        const { data: allUsers } = await supabase
          .from("users")
          .select("id, name")
          .order("name");
        if (allUsers) setUsers(allUsers);
      } else {
        setUsers([{ id: profile.id, name: profile.name }]);
        setPaidById(profile.id);
      }

      const { data: placesData } = await supabase
        .from("places")
        .select(`
          id,
          name,
          type,
          is_favorite,
  expenses (id)
`)
        .order("name");
      if (placesData) {
        const typedPlaces = placesData as PlaceWithExpenses[];

        const enriched = typedPlaces.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          is_favorite: p.is_favorite,
          usageCount: p.expenses?.length ?? 0,
          created_at: p.created_at, 
        }));

        setAllPlaces(enriched);
      }

      const { data: cardsData } = await supabase
        .from("credit_cards")
        .select("id, name, card_type, closing_day, due_day")
        .order("name");
      if (cardsData) setCreditCards(cardsData);
    }

    loadInitialData();
  }, [supabase]);

  useEffect(() => {
    setCreditCardId("");
    if (isValeAlimentacao) setInstallments("1");
  }, [isValeAlimentacao]);

  useEffect(() => {
    if (availableCards.length === 1) setCreditCardId(availableCards[0].id);
  }, [availableCards]);

  function validateField(field: keyof FieldErrors, value: string) {
    const errors = { ...fieldErrors };
    switch (field) {
      case "description":
        errors.description = value.trim()
          ? undefined
          : "Descricao e obrigatoria";
        break;
      case "amount":
        errors.amount =
          parseCurrency(value) > 0 ? undefined : "Informe um valor valido";
        break;
      case "categoryId":
        errors.categoryId = value ? undefined : "Selecione uma categoria";
        break;
      case "paidById":
        errors.paidById = value ? undefined : "Selecione quem pagou";
        break;
    }
    setFieldErrors(errors);
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCurrency(e.target.value);
    setAmount(formatted);
    validateField("amount", formatted);
  }

  function handleCategoryChange(id: string) {
    setCategoryId(id);
    validateField("categoryId", id);

    const cat = categories.find((c) => c.id === id);

    if (cat) {
      setSelectedCategory(cat);
      setScope(cat.default_scope === "joint" ? "joint" : "individual");
      setPlaceId("");
      setPlaceSearch("");

      if (cat.type === "alimentacao") {
        setPaymentMethod("vale_alimentacao");
      }
    }
  }

  const handleDuplicateLastExpense = useCallback(async () => {
    const { data } = await supabase
      .from("expenses")
      .select(
        "description, amount, category_id, scope, paid_by, place_id, notes, payment_method, credit_card_id, installments",
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!data) {
      toast.error("Nenhum gasto anterior encontrado");
      return;
    }

    setDescription(data.description ?? "");
    setAmount(formatCurrency(String(Math.round(Number(data.amount) * 100))));
    if (data.payment_method) setPaymentMethod(data.payment_method);
    if (data.credit_card_id) setCreditCardId(data.credit_card_id);
    if (data.installments) setInstallments(String(data.installments));

    if (data.category_id) {
      const cat = categories.find((c) => c.id === data.category_id);
      if (cat) {
        setCategoryId(cat.id);
        setSelectedCategory(cat);
        setScope(data.scope === "joint" ? "joint" : "individual");
      }
    }

    if (data.paid_by) setPaidById(data.paid_by);
    if (data.notes) setNotes(data.notes);

    if (data.place_id) {
      const place = allPlaces.find((p) => p.id === data.place_id);
      if (place) {
        setPlaceId(place.id);
        setPlaceSearch(place.name);
      }
    }

    toast.info("Ultimo gasto duplicado - ajuste o que precisar");
  }, [supabase, categories, allPlaces]);

  async function getOrCreateMonth(
    year: number,
    month: number,
  ): Promise<string | null> {
    const { data: existing } = await supabase
      .from("months")
      .select("id")
      .eq("year", year)
      .eq("month", month)
      .single();

    if (existing) return existing.id;

    const { data: created } = await supabase
      .from("months")
      .insert({ year, month })
      .select("id")
      .single();

    return created?.id ?? null;
  }

  // Busca produto por nome (case-insensitive) ou cria se nao existir.
  // Retorna o id do produto ou null se o nome estiver vazio.
  async function getOrCreateProduct(name: string): Promise<string | null> {
    const nomeLimpo = name.trim();
    if (!nomeLimpo) return null;

    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .ilike("name", nomeLimpo)
      .limit(1)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created } = await supabase
      .from("products")
      .insert({ name: nomeLimpo })
      .select("id")
      .single();

    return created?.id ?? null;
  }

  function calculateItemsTotal(marketItems: MarketItem[]) {
    return marketItems.reduce((acc, item) => {
      if (item.measurement_type === "weight") {
        return acc + ((item.weight || 0) / 1000) * (item.price_per_kg || 0);
      }
      return acc + (item.quantity || 0) * (item.unit_price || 0);
    }, 0);
  }

  async function handleSave() {
    const errors: FieldErrors = {};
    if (!description.trim()) errors.description = "Descricao e obrigatoria";
    if (!isMarketPlace && parseCurrency(amount) <= 0) {
      errors.amount = "Informe um valor valido";
    }
    if (!categoryId) errors.categoryId = "Selecione uma categoria";
    if (!paidById) errors.paidById = "Selecione quem pagou";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("Preencha todos os campos obrigatorios");
      return;
    }

    if (needsCard && !creditCardId) {
      toast.error("Selecione o cartao utilizado");
      return;
    }

    setLoading(true);

    if (isMarketPlace) {
      const hasInvalidItem = items.some((item) => {
        if (item.measurement_type === "weight") {
          return (
            !item.weight ||
            !item.price_per_kg ||
            item.weight <= 0 ||
            item.price_per_kg <= 0
          );
        }
        return (
          !item.quantity ||
          !item.unit_price ||
          item.quantity <= 0 ||
          item.unit_price <= 0
        );
      });

      if (hasInvalidItem) {
        toast.error("Preencha corretamente os itens do mercado");
        setLoading(false);
        return;
      }
    }

    const finalPaidBy = isAdmin ? paidById : currentUserId;

    let totalAmount = parseCurrency(amount);
    if (isMarketPlace && items.length > 0) {
      totalAmount = calculateItemsTotal(items);
    }

    const numInstallments = isCredit
      ? Math.max(1, Number.parseInt(installments, 10) || 1)
      : 1;
    const installmentAmount = totalAmount / numInstallments;

    let finalScope = scope;
    if (scope === "individual") {
      const { data: payerProfile } = await supabase
        .from("users")
        .select("role")
        .eq("id", finalPaidBy)
        .single();
      finalScope = payerProfile?.role === "admin" ? "mine" : "hers";
    }

    const card = creditCards.find((c) => c.id === creditCardId);
    let firstBilling = {
      month: selectedDate.getMonth() + 1,
      year: selectedDate.getFullYear(),
    };
    if (needsCard && card)
      firstBilling = getBillingMonth(selectedDate, card.closing_day);

    const firstMonthId = await getOrCreateMonth(
      firstBilling.year,
      firstBilling.month,
    );
    if (!firstMonthId) {
      toast.error("Erro ao criar mes.");
      setLoading(false);
      return;
    }

    const { data: parentExpense, error: insertError } = await supabase
      .from("expenses")
      .insert({
        description,
        amount: installmentAmount,
        date: format(selectedDate, "yyyy-MM-dd"),
        category_id: categoryId,
        scope: finalScope,
        paid_by: finalPaidBy,
        owner_id: finalPaidBy,
        month_id: firstMonthId,
        place_id: placeId || null,
        notes: notes || null,
        payment_method: paymentMethod,
        credit_card_id: creditCardId || null,
        installments: numInstallments,
        installment_number: 1,
      })
      .select("id")
      .single();

    if (insertError || !parentExpense) {
      toast.error("Erro ao salvar. Tente novamente.");
      setLoading(false);
      return;
    }

    if (isMarketPlace && items.length > 0) {
      const resolvedItems = await Promise.all(
        items.map(async (item) => {
          const productId = item.product_id
            ? item.product_id
            : await getOrCreateProduct(item.name ?? "");

          const isWeight = item.measurement_type === "weight";
          const total = isWeight
            ? ((item.weight ?? 0) / 1000) * (item.price_per_kg ?? 0)
            : Number(item.quantity ?? 0) * Number(item.unit_price ?? 0);

          return {
            expense_id: parentExpense.id,
            product_id: productId,
            quantity: isWeight ? null : (item.quantity ?? 0),
            unit_price: isWeight ? null : (item.unit_price ?? 0),
            total_price: total,
            weight: isWeight ? (item.weight ?? null) : null,
            price_per_kg: isWeight ? (item.price_per_kg ?? null) : null,
            measurement_type: item.measurement_type ?? "unit",
          };
        }),
      );

      const { error: itemsError } = await supabase
        .from("expense_items")
        .insert(resolvedItems);

      if (itemsError) {
        console.error("[expense_items insert error]", itemsError);
        toast.error(`Erro ao salvar itens: ${itemsError.message}`);
      }
    }

    if (numInstallments > 1) {
      for (let i = 2; i <= numInstallments; i++) {
        const billingDate = addMonths(selectedDate, i - 1);
        const billing = {
          month: billingDate.getMonth() + 1,
          year: billingDate.getFullYear(),
        };
        const monthId = await getOrCreateMonth(billing.year, billing.month);

        await supabase.from("expenses").insert({
          description,
          amount: installmentAmount,
          date: format(billingDate, "yyyy-MM-dd"),
          category_id: categoryId,
          scope: finalScope,
          paid_by: finalPaidBy,
          owner_id: finalPaidBy,
          month_id: monthId,
          place_id: placeId || null,
          payment_method: paymentMethod,
          credit_card_id: creditCardId || null,
          installments: numInstallments,
          installment_number: i,
          parent_expense_id: parentExpense.id,
        });
      }
    }

    toast.success(
      numInstallments > 1
        ? `Gasto parcelado em ${numInstallments}x salvo!`
        : "Gasto salvo com sucesso!",
    );
    setLoading(false);
    handleClose();
    onSaved();
  }

  function handleClose() {
    setDescription("");
    setAmount("");
    setSelectedDate(new Date());
    setCategoryId("");
    setSelectedCategory(null);
    setScope("joint");
    setPaidById(isAdmin ? "" : currentUserId);
    setNotes("");
    setPlaceId("");
    setPlaceSearch("");
    setPaymentMethod("pix");
    setCreditCardId("");
    setInstallments("1");
    setFieldErrors({});
    setCalendarOpen(false);
    setItems([]);
    onClose();
  }

  return {
    description,
    setDescription,
    amount,
    selectedDate,
    setSelectedDate,
    categoryId,
    selectedCategory,
    scope,
    setScope,
    paidById,
    setPaidById,
    notes,
    setNotes,
    placeId,
    setPlaceId,
    placeSearch,
    setPlaceSearch,
    allPlaces,
    setAllPlaces,
    paymentMethod,
    setPaymentMethod,
    creditCardId,
    setCreditCardId,
    installments,
    setInstallments,
    creditCards,
    users,
    isAdmin,
    loading,
    fieldErrors,
    calendarOpen,
    setCalendarOpen,
    items,
    setItems,
    isCredit,
    isValeAlimentacao,
    needsCard,
    availableCards,
    billingPreview,
    selectedPlace,
    isMarketPlace,
    handleAmountChange,
    handleCategoryChange,
    handleDuplicateLastExpense,
    handleSave,
    handleClose,
    validateField,
  };
}
