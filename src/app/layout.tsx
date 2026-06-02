import type { Metadata } from "next"
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" })
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "TributosBO — Herramientas Aduaneras para Bolivia",
  description: "Plataforma SaaS para agencias despachantes e importadores. Calculadora NANDINA, consulta DIM, rastreador de envíos, generador de planillas y más.",
  keywords: "aduana Bolivia, NANDINA, calculadora tributos, despacho aduanero, importacion Bolivia",
  openGraph: {
    title: "TributosBO — Herramientas Aduaneras",
    description: "Todas las herramientas aduaneras de Bolivia en un solo lugar.",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${jakarta.variable} ${mono.variable}`}>
      <body className="font-[family-name:var(--font-inter)] min-h-screen bg-[#F8FAFC]">
        {children}
      </body>
    </html>
  )
}
