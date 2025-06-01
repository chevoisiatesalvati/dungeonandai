import { MedievalSharp } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import { ThemeProvider } from "next-themes";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

const medievalSharp = MedievalSharp({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = getMetadata({
  title: "D&AI - Dungeons & AI",
  description: "A medieval fantasy game powered by AI",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning lang="en" data-theme="light" className={medievalSharp.className}>
      <body className="min-h-screen bg-[#2c1810]">
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
