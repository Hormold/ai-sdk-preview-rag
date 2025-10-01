"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

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
  const [showAllCategories, setShowAllCategories] = useState(false);

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

  const displayedCategories = showAllCategories ? categories : categories.slice(0, 3);

  return (
    <div className="mb-3">
      <div className="flex flex-wrap gap-2 items-center transition-all duration-200">
        <button
          onClick={handleClearAll}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-colors outline-none focus:outline-none border",
            selectedCategories.length === 0
              ? "bg-[#2563eb] text-white border-[#2563eb]"
              : "bg-[#1a1a1a] text-[#999999] hover:bg-[#2a2a2a] border-[#2a2a2a]"
          )}
        >
          All
        </button>
        {displayedCategories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => handleToggleCategory(cat.name)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors outline-none focus:outline-none border",
              selectedCategories.includes(cat.name)
                ? "bg-[#2563eb] text-white border-[#2563eb]"
                : "bg-[#1a1a1a] text-[#999999] hover:bg-[#2a2a2a] border-[#2a2a2a]"
            )}
          >
            {cat.name}{" "}
            <span className={selectedCategories.includes(cat.name) ? "text-white/70" : "text-[#666666]"}>
              ({cat.count})
            </span>
          </button>
        ))}
        {categories.length > 3 && (
          <button
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="px-2 py-1 text-xs text-[#999999] hover:text-white transition-colors outline-none focus:outline-none"
          >
            {showAllCategories ? "Less" : "More"}
          </button>
        )}
      </div>
    </div>
  );
}
