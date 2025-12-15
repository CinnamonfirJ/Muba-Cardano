// src/hooks/use-theme.ts
import { useContext } from "react";
import { ThemeProviderContext } from "@/providers/theme-provider-context";

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (!context) throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
