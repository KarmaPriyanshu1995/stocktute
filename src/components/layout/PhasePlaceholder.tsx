export function PhasePlaceholder({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-3xl text-text-primary">{title}</h1>
      <p className="text-sm text-text-secondary">Ships in {phase}.</p>
    </div>
  );
}
