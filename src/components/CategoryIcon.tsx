import {
  BarChart3,
  Code2,
  Coffee,
  Folder,
  GraduationCap,
  Megaphone,
  PenLine,
  Sparkles,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  pen: PenLine,
  code: Code2,
  mega: Megaphone,
  grad: GraduationCap,
  chart: BarChart3,
  coffee: Coffee,
  tag: Tag,
  spark: Sparkles,
};

export function CategoryIcon({
  icon,
  size = 14,
  className,
}: {
  icon: string;
  size?: number;
  className?: string;
}) {
  const Cmp = MAP[icon] ?? Folder;
  return <Cmp size={size} strokeWidth={2.2} className={className} />;
}
