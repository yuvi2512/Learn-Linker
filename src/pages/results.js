import { useSession } from "next-auth/react";
import withAuth from "@/utils/withAuth";
import PublishResults from "@/components/results/PublishResults";
import StudentResults from "@/components/results/StudentResults";
import { isStaff } from "@/utils/permissions";

function Results() {
  const { data: session } = useSession();

  return isStaff(session?.user) ? <PublishResults /> : <StudentResults />;
}

export default withAuth(Results, ["teacher", "student"]);
