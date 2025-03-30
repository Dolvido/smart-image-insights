export const metadata = {
  title: 'Smart Image Insights - Luke Payne',
  description: 'AI-powered image analysis tool with object detection, classification, and text recognition',
}

import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a101f]`}>{children}</body>
    </html>
  )
}
