import { useSession } from "next-auth/react";
import withAuth from "@/utils/withAuth";
import TeacherOverview from "@/components/dashboard/TeacherOverview";
import StudentOverview from "@/components/dashboard/StudentOverview";
import { isStaff } from "@/utils/permissions";

function Dashboard() {
  const { data: session } = useSession();

  return isStaff(session?.user) ? <TeacherOverview /> : <StudentOverview />;
}

export default withAuth(Dashboard, ["teacher", "student"]);
