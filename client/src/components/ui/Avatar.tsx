// src/components/ui/Avatar.tsx
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 28 }: AvatarProps) {
  return (
    <div
      className="rounded-full bg-accent text-foreground flex items-center justify-center font-mono shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
