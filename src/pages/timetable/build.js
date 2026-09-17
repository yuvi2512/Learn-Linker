import withAuth from "@/utils/withAuth";
import TimetableBuilder from "@/components/timetable/TimetableBuilder";

export default withAuth(TimetableBuilder, ["admin"]);
