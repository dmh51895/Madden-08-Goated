export const metadata = {
  title: "PCFTBALL · Madden Career Toolkit",
  description: "Madden 08 league management toolkit",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
