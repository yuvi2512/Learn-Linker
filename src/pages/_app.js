"use client";
import NavBar from "@/pages/Components/navBar.js";
import LoggedInNav from "@/pages/Components/LoggedInNav";
import { SessionProvider, useSession } from "next-auth/react";
import "../app/globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "../theme";
import { Box, CircularProgress } from "@mui/material";

function AuthWrapper({ Component, pageProps }) {
  const { data: sessionData, status } = useSession();

  if (status === "loading") {
    return (
      <Box
        sx={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {sessionData ? <LoggedInNav /> : <NavBar />}
      <Component {...pageProps} />
    </>
  );
}

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster position="bottom-right" reverseOrder={false} />
        <SessionProvider session={session}>
          <AuthWrapper Component={Component} pageProps={pageProps} />
        </SessionProvider>
      </ThemeProvider>
    </>
  );
}

export default MyApp;
