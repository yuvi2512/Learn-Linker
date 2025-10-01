"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { CircularProgress, Box } from "@mui/material";

export default function withAuth(Component, allowedRoles = []) {
  return function ProtectedComponent(props) {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === "loading") {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (!session) {
      if (typeof window !== "undefined") router.replace("/Login/Login");
      return null;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
      if (typeof window !== "undefined") router.replace("/");
      return null;
    }

    return <Component {...props} />;
  };
}
