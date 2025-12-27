"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "../providers/theme-provider";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { CardanoProvider } from "../context/CardanoContext";
import { useState } from "react";

export function RootProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CardanoProvider>
          <CartProvider>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
              {children}
              <Toaster position="top-right" />
            </ThemeProvider>
          </CartProvider>
        </CardanoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
