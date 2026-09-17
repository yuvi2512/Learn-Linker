import withAuth from "@/utils/withAuth";
import NotesGenerator from "@/components/notes/NotesGenerator";

export default withAuth(NotesGenerator, ["student", "teacher"]);
