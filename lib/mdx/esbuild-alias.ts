import path from "path";

export function withAppAliases(esbuildOptions: any) {
  esbuildOptions.alias = {
    ...(esbuildOptions.alias || {}),
    "@": path.resolve(process.cwd()),
    "@/components": path.resolve(process.cwd(), "components"),
    "@/lib": path.resolve(process.cwd(), "lib"),
    "@/types": path.resolve(process.cwd(), "types"),
    "@/content": path.resolve(process.cwd(), "content"),
  };

  return esbuildOptions;
}


