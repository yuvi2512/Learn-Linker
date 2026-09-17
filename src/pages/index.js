import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import LandingPage from "@/components/marketing/LandingPage";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  return <LandingPage />;
}
