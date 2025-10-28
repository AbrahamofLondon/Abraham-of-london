import * as React from "react";

// Minimal, build-safe stubs—replace with real implementations later.
export const ResourcesCTA: React.FC<{ className?: string }> = () => null;
export const Rule: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children }) => <div>{children}</div>;
export const Note: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children }) => <div>{children}</div>;
export const PullLine: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children }) => <div>{children}</div>;
export const Verse: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children }) => <div>{children}</div>;
export const Caption: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children }) => <div>{children}</div>;
export const ShareRow: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children }) => <div>{children}</div>;
export const CTA: React.FC<React.PropsWithChildren<{ href?: string; className?: string }>> = ({ children }) => <div>{children}</div>;
export const Quote: React.FC<React.PropsWithChildren<{ by?: string; className?: string }>> = ({ children }) => <blockquote>{children}</blockquote>;
export const Badge: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children }) => <span>{children}</span>;
export const BadgeRow: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children }) => <div>{children}</div>;
export const Grid: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children }) => <div>{children}</div>;
export const DownloadCard: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children }) => <div>{children}</div>;
export const HeroEyebrow: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children }) => <div>{children}</div>;
export const Callout: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children }) => <div>{children}</div>;

// Keep JsonLd symbol available for existing imports
export const JsonLd: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children }) => <>{children}</>;