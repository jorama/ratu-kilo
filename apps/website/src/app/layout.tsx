import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ratu Sovereign AI - Your Organization\'s Private AI Node',
  description: 'Multi-tenant SaaS platform for sovereign AI. Complete data control, model-off training, and zero vendor lock-in.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        
        {/* Ratu AI Chat Widget - Eating our own dog food! */}
        <Script id="ratu-widget-config" strategy="beforeInteractive">
          {`
            window.ratuConfig = {
              apiUrl: '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}',
              orgId: 'ratu-marketing',
              apiKey: '${process.env.NEXT_PUBLIC_RATU_WIDGET_KEY || 'demo_key'}',
              theme: 'light',
              position: 'bottom-right'
            };
          `}
        </Script>
        <Script 
          src="/widget/ratu-widget.js" 
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}