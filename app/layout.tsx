// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { GlobalProvider } from './context/GlobalContext'; // Adjust the path as needed

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "Moneyversity Chat Support",
  description: "Moneyversity Chat Support",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GlobalProvider>
          {children}
        </GlobalProvider>
      </body>
    </html>
  );
}
