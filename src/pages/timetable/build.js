import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import withAuth from "@/utils/withAuth";
import TimetableBuilder from "@/components/timetable/TimetableBuilder";
import { canBuildTimetable } from "@/utils/permissions";

function BuildTimetable() {
  const { data: session } = useSession();
  const router = useRouter();
  const allowed = canBuildTimetable(session?.user);

  useEffect(() => {
    if (session && !allowed) router.replace("/timetable");
  }, [session, allowed, router]);

  if (!allowed) return null;

  return <TimetableBuilder />;
}

export default withAuth(BuildTimetable, ["teacher"]);
