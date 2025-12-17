import { type NotificationData, notifications } from '@mantine/notifications';

type Func = (
  opts: Omit<NotificationData, 'message'> & { message?: NotificationData['message'] }
) => void;

type Notify = {
  error: Func;
  success: Func;
  info: Func;
};

export const notify: Notify = {
  error: (props) =>
    notifications.show({
      color: 'red',
      message: '',
      ...props,
    }),
  success: (props) =>
    notifications.show({
      color: 'green',
      message: '',
      ...props,
    }),
  info: (props) =>
    notifications.show({
      color: 'blue',
      message: '',
      ...props,
    }),
};
