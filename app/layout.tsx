import type { Metadata, Viewport } from "next";
import { GameProvider } from "@/components/GameProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniLife: The Syndicate",
  description:
    "A living economic simulation. Build banks, media empires, ISP backbones and criminal networks while Grok-powered rivals try to take it all.",
  applicationName: "OmniLife: The Syndicate",
  keywords: ["economic simulation", "MMO", "strategy game", "crypto", "banking", "syndicate"],
  authors: [{ name: "The Syndicate" }],
  openGraph: {
    title: "OmniLife: The Syndicate",
    description: "The city is a machine. Own the machine.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#060807",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-void text-ink antialiased">
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
