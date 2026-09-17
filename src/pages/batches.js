import withAuth from "@/utils/withAuth";
import BatchManager from "@/components/batches/BatchManager";

export default withAuth(BatchManager, ["teacher"]);
