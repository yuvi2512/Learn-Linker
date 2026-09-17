import { useSession } from "next-auth/react";
import withAuth from "@/utils/withAuth";
import TeacherAssignments from "@/components/assignments/TeacherAssignments";
import StudentAssignments from "@/components/assignments/StudentAssignments";
import { isStaff } from "@/utils/permissions";

function Assignments() {
  const { data: session } = useSession();

  return isStaff(session?.user) ? (
    <TeacherAssignments />
  ) : (
    <StudentAssignments />
  );
}

export default withAuth(Assignments, ["teacher", "student"]);
