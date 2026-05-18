import * as React from "react";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

type TrustInfoRowProps = {
  label: string;
  children: React.ReactNode;
  meta?: string;
};

export default function TrustInfoRow({ label, children, meta }: TrustInfoRowProps) {
  return (
    <div
      className={[
        "grid gap-3 border-b border-white/[0.06] py-5",
        meta
          ? "md:grid-cols-[11.25rem_minmax(0,1fr)_5rem]"
          : "md:grid-cols-[11.25rem_minmax(0,1fr)]",
        "md:items-start md:gap-4 md:py-4",
      ].join(" ")}
    >
      <p
        style={{
          ...mono,
          fontSize: "9px",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: "rgba(201,169,110,0.60)",
        }}
      >
        {label}
      </p>

      <div className="max-w-2xl text-[15px] leading-7 text-white/65 md:text-[17px] md:leading-8">
        {children}
      </div>

      {meta ? (
        <p
          className="md:text-right"
          style={{
            ...mono,
            fontSize: "9px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.42)",
          }}
        >
          {meta}
        </p>
      ) : null}
    </div>
  );
}
