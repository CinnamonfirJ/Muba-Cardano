import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "../index.css";
import { RootProvider } from "@/providers/RootProvider";
import Navbar from "@/components/layout/Navbar"; // Assuming components are aliased or relative
import Footer from "@/components/layout/Footer";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Muba College Ecommerce",
  description: "Campus Based E-Commerce Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-mona antialiased`}>
        <RootProvider>
          <div className="font-mona flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </RootProvider>
      </body>
    </html>
  );
}
