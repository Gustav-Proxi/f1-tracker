import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Your TailwindCSS and global styles

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ultimate F1 Tracker",
  description: "Real-time and historical Formula 1 data with Next.js, OpenF1, Ergast, and ML Prediction",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <header className="bg-red-600 text-white p-4 text-center shadow-md">
          <h1 className="text-3xl font-bold">F1 Race Data</h1>
        </header>
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="bg-gray-800 text-white p-4 text-center mt-10 text-sm">
          <p>&copy; {new Date().getFullYear()} Ultimate F1 Tracker (Unofficial)</p>
        </footer>
      </body>
    </html>
  );
  }