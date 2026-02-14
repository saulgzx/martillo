type NotificationPayload = Record<string, unknown>;

export interface NotificationService {
  send(userId: string, type: string, data: NotificationPayload): Promise<void>;
}

export class ConsoleNotificationService implements NotificationService {
  async send(userId: string, type: string, data: NotificationPayload): Promise<void> {
    // Placeholder until Resend integration is implemented.
    // eslint-disable-next-line no-console
    console.log('[Notification:mock]', { userId, type, data });
  }
}
