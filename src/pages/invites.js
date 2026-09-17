import withAuth from "@/utils/withAuth";
import InviteManager from "@/components/invites/InviteManager";

export default withAuth(InviteManager, ["admin"]);
