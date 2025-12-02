import * as React from "react";

export interface DividerProps {
  label?: string;
  className?: string;
  [key: string]: unknown;
}

const Divider: React.FC<DividerProps> = ({ label, className }) => {
  if (!label) {
    return (
      <hr
        className={[
          "my-10 border-t border-gray-700/70",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      />
    );
  }

  return (
    <div
      className={[
        "my-10 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-gray-400",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
      <span>{label}</span>
      <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
    </div>
  );
};

export default Divider;