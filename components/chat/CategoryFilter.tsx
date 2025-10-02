"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FilterIcon, CheckIcon, ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Category {
  name: string;
  count: number;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onSelectCategories: (categories: string[]) => void;
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onSelectCategories,
}: CategoryFilterProps) {
  const [showAll, setShowAll] = useState(false);

  // Save to localStorage whenever selection changes
  useEffect(() => {
    localStorage.setItem("selected-categories", JSON.stringify(selectedCategories));
  }, [selectedCategories]);

  const handleToggleCategory = (categoryName: string) => {
    const newSelected = selectedCategories.includes(categoryName)
      ? selectedCategories.filter((c) => c !== categoryName)
      : [...selectedCategories, categoryName];
    onSelectCategories(newSelected);
  };

  const handleClearAll = () => {
    onSelectCategories([]);
  };

  if (categories.length === 0) {
    return null;
  }

  const hasActiveFilters = selectedCategories.length > 0;
  const hasMoreCategories = categories.length > 10;
  const displayedCategories = showAll ? categories : categories.slice(0, 10);

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "p-1.5 transition-colors outline-none focus:outline-none",
              hasActiveFilters ? "text-[#2563eb]" : "text-[#94a3b8] hover:text-white"
            )}
            title="Filter categories"
          >
            <FilterIcon className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-[#0f0f10] border-[#262626]">
          <DropdownMenuItem
            onClick={handleClearAll}
            className={cn(
              "cursor-pointer text-xs hover:bg-[#2563eb]/10",
              !hasActiveFilters ? "bg-[#2563eb] text-white hover:bg-[#2563eb]" : "text-[#94a3b8] hover:text-[#cbd5e1]"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span>All categories</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[#262626]" />
          {displayedCategories.map((cat) => {
            const isSelected = selectedCategories.includes(cat.name);
            return (
              <DropdownMenuItem
                key={cat.name}
                onClick={() => handleToggleCategory(cat.name)}
                className={cn(
                  "cursor-pointer text-xs hover:bg-[#2563eb]/10",
                  isSelected ? "bg-[#2563eb] text-white hover:bg-[#2563eb]" : "text-[#94a3b8] hover:text-[#cbd5e1]"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{cat.name}</span>
                  <span className={cn("text-[11px]", isSelected ? "text-white/70" : "text-[#64748b]")}>{cat.count}</span>
                </div>
              </DropdownMenuItem>
            );
          })}
          {hasMoreCategories && (
            <>
              <DropdownMenuSeparator className="bg-[#262626]" />
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  setShowAll(!showAll);
                }}
                className="cursor-pointer text-xs text-[#64748b] hover:text-[#94a3b8] hover:bg-[#1a1a1b] justify-center"
              >
                <ChevronDownIcon className={cn("w-3.5 h-3.5 transition-transform", showAll && "rotate-180")} />
                <span className="ml-1">{showAll ? "Show less" : "Show more"}</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
  );
}
