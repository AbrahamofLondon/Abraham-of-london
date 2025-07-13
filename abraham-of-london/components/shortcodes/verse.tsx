import React from 'react';

export default function Verse({ text }: { text: string }) {
  return (
    <div className="bg-gray-100 p-4 rounded-md border-l-4 border-indigo-500 my-6">
      <p className="italic text-gray-800">&ldquo;{text}&rdquo;</p>
    </div>
  );
}
