"use client";

import { useEffect, useState } from "react";

type Props = {
  textWhenDark: string;
  textWhenLight: string;
  isDark: boolean;
};

export default function ThemeSafeText({ textWhenDark, textWhenLight, isDark }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return <span>{isDark ? textWhenDark : textWhenLight}</span>;
}
