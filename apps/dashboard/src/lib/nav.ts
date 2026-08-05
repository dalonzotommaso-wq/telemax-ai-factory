import {
  LayoutDashboard,
  FolderKanban,
  Wand2,
  BookOpen,
  Library,
  Image,
  Workflow,
  Puzzle,
  Store,
  Settings,
  ScrollText,
  Bot,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Generators", href: "/generators", icon: Wand2 },
  { label: "Knowledge", href: "/knowledge", icon: BookOpen },
  { label: "Prompt Library", href: "/prompt-library", icon: Library },
  { label: "Media", href: "/media", icon: Image },
  { label: "Workflow", href: "/workflow", icon: Workflow },
  { label: "Plugins", href: "/plugins", icon: Puzzle },
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Logs", href: "/logs", icon: ScrollText },
  { label: "AI Providers", href: "/ai-providers", icon: Bot },
];
