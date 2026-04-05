import localFont from "next/font/local";
import SystemShell from "./components/SystemShell";
import { getCards, getSections } from "./lib/queries";
import "./globals.css";

export const dynamic = "force-dynamic";

const microgramma = localFont({
  src: "../media/Microgramma-D-Bold-Extended.ttf",
  variable: "--font-ui",
  display: "swap",
});

const neueHaasMedium = localFont({
  src: "../media/neue-haas-grotesk-font-fanily/neuehaasgrottext-65medium-trial.otf",
  variable: "--font-sidebar",
  display: "swap",
});

const neueHaasRegular = localFont({
  src: "../media/neue-haas-grotesk-font-fanily/neuehaasgrottext-55roman-trial.otf",
  variable: "--font-sidebar-regular",
  display: "swap",
});

const neueHaasBold = localFont({
  src: "../media/neue-haas-grotesk-font-fanily/neuehaasgrottext-75bold-trial.otf",
  variable: "--font-sidebar-bold",
  display: "swap",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: sections } = await getSections();
  const { data: cards } = await getCards();

  return (
    <html lang="en">
      <body
        className={`${microgramma.variable} ${neueHaasMedium.variable} ${neueHaasRegular.variable} ${neueHaasBold.variable}`}
      >
        <SystemShell sections={sections ?? []} cards={cards ?? []}>
          {children}
        </SystemShell>
      </body>
    </html>
  );
}
