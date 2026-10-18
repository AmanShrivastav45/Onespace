export function ItemDescription({
  description,
  compact = false,
}: {
  description: string;
  compact?: boolean;
}) {
  const text = description.trim() || "No description added yet.";
  return (
    <span
      className={
        compact
          ? "mt-1 line-clamp-2 text-[length:calc(0.6429rem*var(--main-font-scale))] leading-relaxed text-[#81758e] [overflow-wrap:anywhere]"
          : "mt-1.5 block whitespace-pre-wrap text-[length:calc(0.7143rem*var(--main-font-scale))] leading-relaxed text-[#8c8396] [overflow-wrap:anywhere]"
      }
      title={compact ? text : undefined}
    >
      {text}
    </span>
  );
}
