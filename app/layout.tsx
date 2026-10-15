import type { Metadata } from "next";
import "./globals.css";

// Absolute URL of the deployed site, used for the social preview image.
// Override with NEXT_PUBLIC_SITE_URL when hosting somewhere else.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexbaillie.github.io/mossy-hop";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const description = "Guide one very bouncy, fluffy friend through ten increasingly wild and detailed worlds.";
const socialTitle = "Mossy Hop — Ten Worlds, One Fluffy Hero";
const imageUrl = `${siteUrl}/og.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Mossy Hop",
  description,
  icons: { icon: `${basePath}/mossy-character-v2.png` },
  openGraph: {
    title: socialTitle,
    description,
    type: "website",
    images: [{
      url: imageUrl,
      width: 1672,
      height: 941,
      alt: "Mossy, a fluffy green ball, jumping over a stump in a sunny woodland",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: socialTitle,
    description,
    images: [imageUrl],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
