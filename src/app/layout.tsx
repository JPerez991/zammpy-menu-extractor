import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zammpy Menu Extractor",
  description: "Extrae menús desde fotos y créalos en Zammpy",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <script
          src="https://accounts.google.com/gsi/client"
          async
          defer
        />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
