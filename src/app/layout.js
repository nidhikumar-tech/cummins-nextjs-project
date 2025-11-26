export const metadata = {
  title: "Next.js Google Map Dashboard",
  description: "Dashboard displaying Google Maps",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
