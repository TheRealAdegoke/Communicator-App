import { toast as sonnerToast, Toaster } from "sonner";

export { Toaster };

export const toast = Object.assign(sonnerToast, {
  success: sonnerToast.success,
  error: sonnerToast.error,
  warning: sonnerToast.warning,
  info: sonnerToast.info,
  promise: sonnerToast.promise,
  loading: sonnerToast.loading,
  dismiss: sonnerToast.dismiss,
});

export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  };
}

export default toast;
