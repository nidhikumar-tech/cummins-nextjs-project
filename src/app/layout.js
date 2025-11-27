import Navbar from "@/components/dashboard/Navbar";
import "./globals.css";

export const metadata = {
  title: "Cummins Analytics - Fuel Station Data Visualization",
  description: "Professional data visualization platform for fuel station analytics with interactive heatmaps, graphs, and charts",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
