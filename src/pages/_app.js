import { Plus_Jakarta_Sans } from "next/font/google";
import Head from "next/head";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, CircularProgress, Typography } from "@mui/material";
import MarketingNav from "@/components/layout/MarketingNav";
import AppShell from "@/components/layout/AppShell";
import theme from "../theme";
import "../styles/globals.css";
import axios from "axios";
import { Analytics } from "@vercel/analytics/next"

axios.defaults.withCredentials = true;

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Auth screens own the full viewport; marketing pages get the public nav.
// Everything else is a signed-in workspace route.
const AUTH_ROUTE_PREFIXES = ["/login", "/register"];
const MARKETING_ROUTES = ["/", "/privacy"];

const isAuthRoute = (pathname) =>
  AUTH_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

function FullPageLoader() {
  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        bgcolor: "background.default",
      }}
    >
      <CircularProgress />
      <Typography color="text.secondary" variant="body2">
        Loading workspace…
      </Typography>
    </Box>
  );
}

function Layout({ Component, pageProps }) {
  const { data: session, status } = useSession();
  const { pathname } = useRouter();

  if (isAuthRoute(pathname)) {
    return <Component {...pageProps} />;
  }

  if (MARKETING_ROUTES.includes(pathname)) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <MarketingNav />
        <Box component="main" sx={{ flex: 1 }}>
          <Component {...pageProps} />
        </Box>
      </Box>
    );
  }

  if (status === "loading") return <FullPageLoader />;

  // Signed out on a protected route: withAuth redirects to /login.
  if (!session) return <Component {...pageProps} />;

  return (
    <AppShell>
      <Component {...pageProps} />
    </AppShell>
  );
}

export default function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <>
      <Head>
        <title>Learn Linker — Coaching management</title>
        <meta
          name="description"
          content="Attendance, results, assignments, tests, and study notes for coaching institutes."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box className={jakarta.className}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                borderRadius: "12px",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontSize: 14,
              },
            }}
          />
          <SessionProvider session={session} refetchOnWindowFocus>
            <Layout Component={Component} pageProps={pageProps} />
          </SessionProvider>
        </ThemeProvider>
      </Box>
      <Analytics />
    </>
  );
}
