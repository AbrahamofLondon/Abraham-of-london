// components/Footer.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";

const AOF_URL =
  process.env.NEXT_PUBLIC_AOF_URL || "https://abrahamoflondon.org";
const INNOVATE_HUB_URL =
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL ||
  process.env.NEXT_PUBLIC_INNOVATEHUB_ALT_URL ||
  "https://innovatehub-abrahamoflondon.netlify.app";
const ALOMARADA_URL =
  process.env.NEXT_PUBLIC_ALOMARADA_URL || "https://alomarada.com";
const ENDURELUXE_URL =
  process.env.NEXT_PUBLIC_ENDURELUXE_URL || "https://endureluxe.com";
const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@abrahamoflondon.org";

const socials = [
  {
    href: "https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw