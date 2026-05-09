import './globals.css';

export const metadata = {
  title: 'AutoBuscar.ar - Comparador de autos en Argentina',
  description: 'Busca y compara precios de autos en MercadoLibre, Kavak, OLX, V6 y mas.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}