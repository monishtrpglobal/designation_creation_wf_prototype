import "@mantine/core/styles.layer.css";
import "@/styles/tokens.css";
import "./globals.css";

import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import type { Metadata } from "next";
import { Inter, Lato } from "next/font/google";
import { FlowHydration } from "@/state/DevBar";
import { theme } from "@/theme/mantine-theme";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: "iRM prototype",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${lato.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ColorSchemeScript forceColorScheme="light" />
      </head>
      <body>
        <MantineProvider forceColorScheme="light" theme={theme}>
          <div className="flex min-h-dvh flex-col">
            <FlowHydration />
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </div>
        </MantineProvider>
      </body>
    </html>
  );
}
