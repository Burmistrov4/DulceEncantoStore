export default function UrgencyBar({ text }: { text: string }) {
  return (
    <div className="bg-berry text-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2.5 px-4 py-2 text-center text-[13px] font-bold sm:text-sm">
        <span className="size-2 shrink-0 animate-pulse-dot rounded-full bg-honey" aria-hidden="true" />
        <span>{text}</span>
      </div>
    </div>
  );
}
