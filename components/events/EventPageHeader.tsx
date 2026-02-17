import * as React from "react";

type Props = {
  title: string;
  date?: string | null;
  location?: string | null;
  summary?: string | null;
};

export default function EventPageHeader({
  title,
  date,
  location,
  summary,
}: Props): React.ReactElement {
  return (
    <header className="mb-8 border-b border-gray-200 pb-6">
      <h1 className="font-serif text-3xl text-deepCharcoal">{title}</h1>
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
        {date ? (
          <span>
            {new Date(date).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </span>
        ) : null}
        {location ? <span>• {location}</span> : null}
      </div>
      {summary ? <p className="mt-4 text-gray-700">{summary}</p> : null}
    </header>
  );
}