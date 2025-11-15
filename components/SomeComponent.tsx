// components/SomeComponent.tsx
"use client";

import * as React from "react";
import InteractiveElement from "@/components/ui/InteractiveElement";

interface SomeComponentProps {
  title?: string;
  description?: string;
  variant?: "default" | "featured";
}

export default function SomeComponent({
  title = "Interactive Component",
  description = "This component demonstrates the use of InteractiveElement",
  variant = "default",
}: SomeComponentProps) {
  const [clickCount, setClickCount] = React.useState(0);

  const handleButtonClick = () => {
    setClickCount(prev => prev + 1);
  };

  return (
    <div className={`p-6 rounded-lg border ${
      variant === "featured" 
        ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" 
        : "bg-white border-gray-200"
    }`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{description}</p>
      
      <div className="flex flex-wrap gap-4 items-center">
        <InteractiveElement
          variant="primary"
          onClick={handleButtonClick}
        >
          Click me! ({clickCount})
        </InteractiveElement>

        <InteractiveElement
          variant="outline"
          size="sm"
          onClick={() => alert("Outline button clicked!")}
        >
          Outline
        </InteractiveElement>

        <InteractiveElement
          variant="success"
          loading={clickCount > 5}
          onClick={handleButtonClick}
        >
          {clickCount > 5 ? "Processing..." : "Success"}
        </InteractiveElement>

        <InteractiveElement
          as="a"
          href="#"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            console.log("Link clicked");
          }}
        >
          Link Button
        </InteractiveElement>
      </div>

      {clickCount > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm">
            Button clicked {clickCount} time{clickCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}