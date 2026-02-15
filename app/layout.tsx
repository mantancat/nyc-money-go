import "./globals.css";

export const metadata = {
  title: "Where does my money go?",
  description: "NYC click-to-unlock tax allocation explainer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
