import withAuth from "@/utils/withAuth";
import AttendanceManager from "@/components/attendance/AttendanceManager";

export default withAuth(AttendanceManager, ["teacher"]);
