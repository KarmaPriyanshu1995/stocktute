import { ClassroomTutor } from "@/components/learn/ClassroomTutor";
import { buildClassroomLesson, HAMMER_PRIMARY_CHART_KEY } from "@/lib/detection/classroomLesson";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { auth } from "@/auth";
import { isLocale } from "@/lib/i18n";

export default async function ClassroomPage() {
  let level = 2;
  let language: "en" | "hi" | "hinglish" = "en";
  try {
    const session = await auth();
    if (session?.user?.id) {
      await connectToDatabase();
      const user = await User.findById(session.user.id).select("level language").lean();
      if (typeof user?.level === "number") level = user.level;
      if (isLocale(user?.language)) language = user.language;
    }
  } catch {
    // Vocabulary falls back to Level 2 / English if the profile cannot be read.
  }

  return (
    <ClassroomTutor lesson={buildClassroomLesson(HAMMER_PRIMARY_CHART_KEY, { studentLevel: level, language })} />
  );
}
