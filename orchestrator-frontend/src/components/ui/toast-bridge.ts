export type ToastBridgeOptions = {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
};

let externalToast: ((options: ToastBridgeOptions) => void) | null = null;

export function setExternalToast(toastFn: (options: ToastBridgeOptions) => void) {
  externalToast = toastFn;
}

export function clearExternalToast(toastFn: (options: ToastBridgeOptions) => void) {
  if (externalToast === toastFn) {
    externalToast = null;
  }
}

export function showToast(options: ToastBridgeOptions) {
  externalToast?.(options);
}
