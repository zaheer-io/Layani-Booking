import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { AlertProvider } from "@/context/AlertContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Layani | Premium Tea & Snacks",
  description: "Experience the premium taste of Layani Tea and Snacks. QR-based loyalty and product browsing system.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Layani",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <AlertProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </AlertProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
