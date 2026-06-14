import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Irish Peptides Command Centre",
  description: "Irish Peptides & Nutrition — Jarvis Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        {/* Hotjar Tracking Code */}
        <Script
          id="hotjar"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:process.env.NEXT_PUBLIC_HOTJAR_ID||'HOTJAR_SITE_ID',hjsv:6};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+'.js?sv='+h._hjSettings.hjsv;
                a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-');
            `,
          }}
        />
        {/* Tidio Live Chat */}
        <Script
          id="tidio"
          src={`//code.tidio.co/${process.env.NEXT_PUBLIC_TIDIO_KEY || 'TIDIO_PUBLIC_KEY'}.js`}
          strategy="afterInteractive"
        />
      </head>
      <body className="h-full flex bg-[#111111] text-[#F1F5F9] antialiased">
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
