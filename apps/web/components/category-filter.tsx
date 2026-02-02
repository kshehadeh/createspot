"use client";

import { useTranslations } from "next-intl";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";

interface CategoryFilterProps {
  categories: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
}

export function CategoryFilter({
  categories,
  selected,
  onSelectionChange,
  placeholder = "Filter by category...",
}: CategoryFilterProps) {
  const tCategories = useTranslations("categories");

  // Create options from available categories, using translations
  const categoryOptions: MultiSelectOption[] = categories.map((category) => ({
    value: category,
    label: tCategories(category),
  }));

  return (
    <MultiSelect
      options={categoryOptions}
      selected={selected}
      onSelectionChange={onSelectionChange}
      placeholder={placeholder}
    />
  );
}
