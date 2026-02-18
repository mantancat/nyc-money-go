import "./globals.css";

export const metadata = {
  title: "Where does my money go? | NYC",
  description: "See how your NYC income tax dollars map to NYC budget categories and subcategories.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
