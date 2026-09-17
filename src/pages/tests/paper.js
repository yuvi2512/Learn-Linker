import withAuth from "@/utils/withAuth";
import TestPaperBuilder from "@/components/tests/TestPaperBuilder";

export default withAuth(TestPaperBuilder, ["teacher"]);
