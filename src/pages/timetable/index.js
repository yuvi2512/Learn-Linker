import withAuth from "@/utils/withAuth";
import TimetableView from "@/components/timetable/TimetableView";

export default withAuth(TimetableView, ["student", "teacher"]);
