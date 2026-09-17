import { useSession } from "next-auth/react";
import withAuth from "@/utils/withAuth";
import TeacherTests from "@/components/tests/TeacherTests";
import StudentTests from "@/components/tests/StudentTests";
import { isStaff } from "@/utils/permissions";

function Tests() {
  const { data: session } = useSession();

  return isStaff(session?.user) ? <TeacherTests /> : <StudentTests />;
}

export default withAuth(Tests, ["teacher", "student"]);
