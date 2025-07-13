import React from 'react';

export default function AlertBox({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'warning' | 'success' }) {
  const base = "p-4 rounded-md border-l-4 my-4";
  const variants = {
    info: "bg-blue-50 border-blue-500 text-blue-800",
    warning: "bg-yellow-50 border-yellow-500 text-yellow-800",
    success: "bg-green-50 border-green-500 text-green-800",
  };

  return <div className={`${base} ${variants[type]}`}>{children}</div>;
}
