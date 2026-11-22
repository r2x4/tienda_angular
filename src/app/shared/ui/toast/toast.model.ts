export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  variant?: ToastVariant;
  title?: string;
  message: string;
  duration?: number | null; // ms, null disables auto-close
  dismissible?: boolean;
}

export interface ToastItem extends Required<Pick<ToastOptions, 'message' | 'dismissible'>> {
  id: number;
  variant: ToastVariant;
  title: string;
  duration: number | null;
}
