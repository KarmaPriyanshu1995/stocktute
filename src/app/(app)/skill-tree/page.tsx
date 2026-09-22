import { SkillTreeView } from "@/components/learn/SkillTreeView";
import { COURSE_RULES, courseStats } from "@/lib/curriculum";

export default function SkillTreePage() {
  const stats = courseStats();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Skill Tree</h1>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          Twelve levels from market foundations to capstone. {stats.published} of {stats.lessons}{" "}
          lessons are open now. Futures, options and algo stay locked until you pass risk training.
        </p>
      </div>
      <SkillTreeView />
      <section className="rounded-lg border border-bg-border bg-bg-raised p-5">
        <h2 className="text-sm font-medium text-text-primary">Platform rules</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
          {COURSE_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
