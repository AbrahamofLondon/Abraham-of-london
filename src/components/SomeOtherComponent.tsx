// src/components/SomeOtherComponent.tsx
"use client";

import * as React from "react";
import InteractiveElement from "@/components/ui/InteractiveElement";

interface SomeOtherComponentProps {
  items?: string[];
  onItemAction?: (item: string, action: string) => void;
}

export default function SomeOtherComponent({
  items = ["Item 1", "Item 2", "Item 3", "Item 4"],
  onItemAction,
}: SomeOtherComponentProps) {
  const [activeItems, setActiveItems] = React.useState<Set<string>>(new Set());
  const [itemList, setItemList] = React.useState<string[]>(items);

  const toggleItem = (item: string) => {
    setActiveItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item)) {
        newSet.delete(item);
        onItemAction?.(item, "deactivated");
      } else {
        newSet.add(item);
        onItemAction?.(item, "activated");
      }
      return newSet;
    });
  };

  const handleAddItem = () => {
    const newItem = `Item ${itemList.length + 1}`;
    setItemList((prev) => [...prev, newItem]);
    onItemAction?.(newItem, "added");
  };

  const handleReset = () => {
    setActiveItems(new Set());
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Interactive List Component
      </h3>

      <div className="space-y-3 mb-6">
        {itemList.map((item) => (
          <div
            key={item}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span
              className={`font-medium ${
                activeItems.has(item) ? "text-green-600" : "text-gray-700"
              }`}
            >
              {item}
              {activeItems.has(item) && (
                <span className="ml-2 text-xs text-green-500">● Active</span>
              )}
            </span>

            <div className="flex gap-2">
              <InteractiveElement
                variant={activeItems.has(item) ? "secondary" : "primary"}
                size="sm"
                onClick={() => toggleItem(item)}
              >
                {activeItems.has(item) ? "Deactivate" : "Activate"}
              </InteractiveElement>

              <InteractiveElement
                variant="ghost"
                size="sm"
                onClick={() => onItemAction?.(item, "viewed")}
              >
                View
              </InteractiveElement>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <InteractiveElement
          variant="success"
          onClick={handleAddItem}
          className="flex-1"
        >
          Add New Item
        </InteractiveElement>

        <InteractiveElement variant="outline" onClick={handleReset}>
          Reset All
        </InteractiveElement>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>
          Total items: {itemList.length} | Active: {activeItems.size}
        </p>
      </div>
    </div>
  );
}
