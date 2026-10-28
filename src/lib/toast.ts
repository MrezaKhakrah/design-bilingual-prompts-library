import { uid } from "./utils";

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  id: string;
  title: string;
  desc?: string;
  kind?: "default" | "success" | "danger";
  action?: ToastAction;
}

type Listener = (t: Toast) => void;

const listeners = new Set<Listener>();

export function pushToast(t: Omit<Toast, "id">): void {
  const full: Toast = { ...t, id: uid() };
  listeners.forEach((l) => l(full));
}

export function subscribeToasts(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
