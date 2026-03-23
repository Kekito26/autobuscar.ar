import { Inter, Unbounded } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "AutoBuscar.ar — Comparador de autos en Argentina",
  description: "Busca y compara precios de autos en MercadoLibre, Kavak, OLX, V6 y más. Encontrá tu próximo auto en un solo lugar.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${unbounded.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
