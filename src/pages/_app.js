"use client";
import NavBar from "@/pages/Components/navBar.js";
import LoggedInNav from "@/pages/Components/LoggedInNav";
import { useState, useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
// import "../app/globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";

function AuthWrapper({ Component, pageProps }) {
  const [LoggedIn, setLoggedIn] = useState(false);
  const { data: sessionData } = useSession();

  useEffect(() => {
    if (sessionData?.user) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  }, [sessionData]);

  return (
    <>
      {LoggedIn ? <LoggedInNav /> : <NavBar />}
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
