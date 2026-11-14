import { Cinzel, JetBrains_Mono, Noto_Serif_KR } from "next/font/google";
import { APP_NAME, APP_TAGLINE, BRAND, CHALLENGE_NAME, TEAM_NAME } from "@/lib/constants";
import { AppProviders } from "@/lib/context/AppProviders";
import "./globals.css";

/** The one reading face of the product: Noto Serif KR, for titles and body alike. */
const inter = Noto_Serif_KR({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-data",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Display face. Carries the wordmark, page titles and the large-format instrument numerals,
 * and nothing else — body copy stays in Inter so the technical register is not diluted.
 */
/** Engraved capitals for page titles and the team cartouche: the Pharaonic voice of the UI. */
const royal = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const display = Noto_Serif_KR({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});


export const metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description: `${APP_NAME} is an AI-powered research dashboard for microgravity fire safety, built by ${TEAM_NAME} for the ${CHALLENGE_NAME}. Every number comes from 1,412 measured or published NASA records, and each panel says whether it shows a measurement, a replay, a model or an illustration. ${BRAND.disclosure}`,
  applicationName: APP_NAME,
  authors: [{ name: TEAM_NAME }],
  keywords: ["microgravity", "fire safety", "combustion", "NASA Space Apps", "research dashboard"],
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${mono.variable} ${display.variable} ${royal.variable} h-full antialiased`}
    >
      <head>
        {/* Applies the stored theme before first paint, so light mode never flashes dark. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=JSON.parse(localStorage.getItem("flarenexus:theme"));document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark")}catch(e){};try{if(sessionStorage.getItem("fx:entered"))document.documentElement.setAttribute("data-entered","1")}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full bg-surface text-ink">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
