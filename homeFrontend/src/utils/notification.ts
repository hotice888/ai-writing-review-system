import { ElNotification } from 'element-plus';

type NotificationType = 'success' | 'warning' | 'info' | 'error';

export const showNotification = (
  message: string,
  type: NotificationType = 'info',
  title?: string
) => {
  ElNotification({
    title,
    message,
    type,
    duration: 3000,
  });
};

export const showSuccess = (message: string, title?: string) => {
  showNotification(message, 'success', title);
};

export const showError = (message: string, title?: string) => {
  showNotification(message, 'error', title);
};

export const showWarning = (message: string, title?: string) => {
  showNotification(message, 'warning', title);
};

export const showInfo = (message: string, title?: string) => {
  showNotification(message, 'info', title);
};
