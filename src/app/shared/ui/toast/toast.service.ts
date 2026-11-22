import { Injectable, signal } from '@angular/core';
import { ToastItem, ToastOptions, ToastVariant } from './toast.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  private timers = new Map<number, ReturnType<typeof setTimeout>>();
  readonly toasts = signal<ToastItem[]>([]);

  show(options: ToastOptions): number {
    const id = ++this.seq;
    const item: ToastItem = {
      id,
      variant: options.variant ?? 'info',
      title: options.title ?? '',
      message: options.message,
      duration: options.duration === undefined ? 4500 : options.duration,
      dismissible: options.dismissible ?? true,
    };
    this.toasts.update(list => [...list, item]);
    if (item.duration && item.duration > 0) {
      this.timers.set(id, setTimeout(() => this.dismiss(id), item.duration));
    }
    return id;
  }

  success(message: string, title = 'Éxito', duration?: number | null): number { return this.show({ variant: 'success', title, message, duration }); }
  error(message: string, title = 'Error', duration?: number | null): number { return this.show({ variant: 'error', title, message, duration: duration === undefined ? 7000 : duration }); }
  warning(message: string, title = 'Atención', duration?: number | null): number { return this.show({ variant: 'warning', title, message, duration }); }
  info(message: string, title = 'Información', duration?: number | null): number { return this.show({ variant: 'info', title, message, duration }); }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) { clearTimeout(timer); this.timers.delete(id); }
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  clear(): void {
    this.timers.forEach(t => clearTimeout(t));
    this.timers.clear();
    this.toasts.set([]);
  }
}
