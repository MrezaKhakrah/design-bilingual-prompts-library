export type Lang = "fa" | "en";

export interface PromptVersion {
  id: string;
  n: number;
  content: string;
  note?: string;
  createdAt: number;
}

export interface Prompt {
  id: string;
  title: string;
  desc: string;
  content: string;
  categoryId: string;
  tags: string[];
  favorite: boolean;
  usage: number;
  createdAt: number;
  updatedAt: number;
  versions: PromptVersion[];
  /** remembered default values for {{variables}} */
  defaults: Record<string, string>;
}

export interface Category {
  id: string;
  label: Record<Lang, string>;
  icon: string;
  color: string;
}

export interface Store {
  prompts: Prompt[];
  categories: Category[];
}

export interface BackupFile {
  app: string;
  version: number;
  exportedAt: number;
  prompts: Prompt[];
  categories: Category[];
}

export type FilterKind = "all" | "fav" | "recent" | "cat";

export interface Filter {
  kind: FilterKind;
  catId?: string;
}
