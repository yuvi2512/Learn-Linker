"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { CircularProgress, Box } from "@mui/material";
import { hasAllowedRole } from "@/utils/permissions";

export default function withAuth(Component, allowedRoles = []) {
  return function ProtectedComponent(props) {
    const { data: session, status } = useSession();
    const router = useRouter();

    const loading = status === "loading";
    const signedOut = status === "unauthenticated";
    const wrongRole =
      Boolean(session) &&
      allowedRoles.length > 0 &&
      !hasAllowedRole(session.user?.role, allowedRoles);

    useEffect(() => {
      if (loading) return;

      if (signedOut) {
        router.replace({ pathname: "/login", query: { next: router.asPath } });
        return;
      }

      if (wrongRole) router.replace("/dashboard");
    }, [loading, signedOut, wrongRole, router]);

    if (loading || signedOut || wrongRole) {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
            bgcolor: "background.default",
          }}
        >
          <CircularProgress size={28} />
        </Box>
      );
    }

    return <Component {...props} />;
  };
}
