import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "127.0.0.1:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("127.0.0.1") || host.includes("localhost") ? "http" : "https");
  const imageUrl = new URL("/og.png", `${protocol}://${host}`).toString();

  return {
    title: "Mossy Hop",
    description: "Guide one very bouncy, fluffy friend through ten increasingly wild and detailed worlds.",
    openGraph: {
      title: "Mossy Hop — Ten Worlds, One Fluffy Hero",
      description: "Guide one very bouncy, fluffy friend through ten increasingly wild and detailed worlds.",
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
      title: "Mossy Hop — Ten Worlds, One Fluffy Hero",
      description: "Guide one very bouncy, fluffy friend through ten increasingly wild and detailed worlds.",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
