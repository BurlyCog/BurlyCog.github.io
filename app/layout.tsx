import localFont from "next/font/local";
import SystemShell from "./components/SystemShell";
import { getCards, getSections } from "./lib/queries";
import "./globals.css";

// Portfolio content is managed in Supabase and should be read again on every request.
export const dynamic = "force-dynamic";

const microgramma = localFont({
  src: "../media/fonts/microgramma-d-bold-extended.woff2",
  variable: "--font-ui",
  weight: "700",
  display: "swap",
});

const neueHaasMedium = localFont({
  src: "../media/fonts/neue-haas-text-medium.woff2",
  variable: "--font-sidebar",
  weight: "500",
  display: "swap",
});

const neueHaasRegular = localFont({
  src: "../media/fonts/neue-haas-text-regular.woff2",
  variable: "--font-sidebar-regular",
  weight: "400",
  display: "swap",
});

const neueHaasBold = localFont({
  src: "../media/fonts/neue-haas-text-bold.woff2",
  variable: "--font-sidebar-bold",
  weight: "700",
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
