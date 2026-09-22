import { ClassroomTutor } from "@/components/learn/ClassroomTutor";
import { buildHammerClassroomLesson } from "@/lib/detection/classroomLesson";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { auth } from "@/auth";

export default async function ClassroomPage() {
  let level = 2;
  try {
    const session = await auth();
    if (session?.user?.id) {
      await connectToDatabase();
      const user = await User.findById(session.user.id).select("level").lean();
      if (typeof user?.level === "number") level = user.level;
    }
  } catch {
    // Vocabulary falls back to Level 2 if the profile cannot be read.
  }

  return <ClassroomTutor lesson={buildHammerClassroomLesson(level)} />;
}
