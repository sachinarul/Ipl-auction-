import type { Metadata } from 'next';
import { Outfit, Bebas_Neue, Barlow_Condensed, Rajdhani } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
});

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bebas',
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-barlow',
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-rajdhani',
});

export const metadata: Metadata = {
  title: 'AuctionVerse Cricket — Premium IPL Mega Auction Simulator',
  description: 'Step into the franchise owner shoes, strategize with 5 AI personalities, manage your 120 Crore budget, and assemble your dream cricket team in this premium real-time auction simulator.',
  keywords: 'IPL auction, cricket simulator, IPL game, cricket manager, fantasy cricket, mega auction',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${bebasNeue.variable} ${barlowCondensed.variable} ${rajdhani.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-midnight text-av-text">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-neon-purple)_0%,_transparent_45%)] opacity-20 pointer-events-none z-0" />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--color-neon-cyan)_0%,_transparent_35%)] opacity-10 pointer-events-none z-0" />
        <main className="flex-1 flex flex-col relative z-10">{children}</main>
      </body>
    </html>
  );
}
