"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "lucide-react"; // Wait, Link is component or icon? Lucid has Link icon. Next has Link component. Be careful.
import NextLink from "next/link";
import { Button } from "@/components/ui/button";

export default function VendorDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              +0% from last month
            </p>
          </CardContent>
        </Card>
        {/* Add more stats */}
      </div>
      
      <div className="flex gap-4">
          <NextLink href="/vendor/orders">
            <Button>View Orders</Button>
          </NextLink>
      </div>
    </div>
  );
}
