import Navbar from "@/components/navbar/Navbar";
import "./globals.css";
// [CHANGE START] Import AuthProvider
import { AuthProvider } from "@/context/AuthContext";
// [CHANGE END]

export const metadata = {
  title: "Cummins Analytics - Fuel Station Data Visualization",
  description: "Professional data visualization platform for fuel station analytics with interactive heatmaps, graphs, and charts",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* [CHANGE START] Wrap children in AuthProvider */}
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
        {/* [CHANGE END] */}
      </body>
    </html>
  );
}