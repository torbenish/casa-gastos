"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalendarProps = {
  selected?: Date;
  onSelect?: (date: Date) => void;
  locale?: string;
  className?: string;
};

const MONTHS_PT = [
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

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Calendar({ selected, onSelect, className }: CalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = React.useState(
    selected?.getFullYear() ?? today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = React.useState(
    selected?.getMonth() ?? today.getMonth(),
  );

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function isSelected(day: number) {
    return selected
      ? selected.getFullYear() === viewYear &&
          selected.getMonth() === viewMonth &&
          selected.getDate() === day
      : false;
  }

  function isToday(day: number) {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  }

  return (
    <div className={cn("p-3 w-64", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 p-0 opacity-50 hover:opacity-100",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          {MONTHS_PT[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 p-0 opacity-50 hover:opacity-100",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_PT.map((d) => (
          <div
            key={d}
            className="text-center text-[0.75rem] text-muted-foreground font-normal py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => (
          <div
            key={day ? `${viewYear}-${viewMonth}-${day}` : `empty-${i}`}
            className="flex items-center justify-center"
          >
            {day ? (
              <button
                type="button"
                onClick={() => onSelect?.(new Date(viewYear, viewMonth, day))}
                className={cn(
                  "h-9 w-9 rounded-md text-sm transition-colors",
                  isSelected(day)
                    ? "bg-primary text-primary-foreground font-medium"
                    : isToday(day)
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {day}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
