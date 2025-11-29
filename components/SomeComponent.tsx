// components/SomeComponent.tsx
"use client";

import * as React from "react";
import Button from "@/components/ui/Button"; // Note: lowercase 'b' if file is Button.tsx

interface SomeComponentProps {
  title?: string;
  description?: string;
  variant?: "default" | "featured";
}

export default function SomeComponent({
  title = "Interactive Component",
  description = "This component demonstrates the use of Button",
  variant = "default",
}: SomeComponentProps) {
  const [clickCount, setClickCount] = React.useState(0);

  const handleButtonClick = () => {
    setClickCount((prev) => prev + 1);
  };

  return (
    <div
      className={`p-6 rounded-lg border ${
        variant === "featured"
          ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200"
          : "bg-white border-gray-200"
      }`}
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{description}</p>

      <div className="flex flex-wrap gap-4 items-center">
        <Button variant="primary" onClick={handleButtonClick}>
          Click me! ({clickCount})
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => alert("Secondary button clicked!")}
        >
          Secondary
        </Button>

        <Button
          variant="primary"
          disabled={clickCount > 5}
          onClick={handleButtonClick}
        >
          {clickCount > 5 ? "Max clicks reached!" : "Primary"}
        </Button>

        <Button
          href="#"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            console.log("Link clicked");
          }}
        >
          Link Button
        </Button>
      </div>

      {clickCount > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm">
            Button clicked {clickCount} time{clickCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
