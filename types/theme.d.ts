// types/theme.d.ts
declare module "@/contexts/ThemeContext" {
  import { ThemeContextType } from '...';
  export const useTheme: () => ThemeContextType;
  export const ThemeProvider: React.ComponentType<any>;
}
