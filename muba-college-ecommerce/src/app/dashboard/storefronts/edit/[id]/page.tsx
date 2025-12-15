"use client";

import StoreForm from "@/components/dashboard/StoreForm";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  // In Next.js 15+, params is a Promise in Server Components.
  // But this is a Client Component (use client).
  // However, dynamic routes usually pass params as prop.
  // To be safe and compatible with recent Nextjs versions:
  const [id, setId] = useState<string>("");

  useEffect(() => {
    // Handling unwrapping params if it's a promise, or just using it.
    // For simplicity in standard Next 14/15 usage:
    // We can use `useParams` from next/navigation
    // which is the client-side hook way.
  }, []);

  // Using standard hook approach:
  const hookParams = useParams<{ id: string }>();
  
  return <StoreForm storeId={hookParams.id} />;
}
