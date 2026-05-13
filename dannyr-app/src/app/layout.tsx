import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DannyR — Sistema de Live Selling",
  description: "Sistema operativo interno para gestión de ventas en vivo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
