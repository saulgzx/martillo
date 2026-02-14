type NotificationPayload = Record<string, unknown>;
import { logger } from '../utils/logger';

export interface NotificationService {
  send(userId: string, type: string, data: NotificationPayload): Promise<void>;
}

export class ConsoleNotificationService implements NotificationService {
  async send(userId: string, type: string, data: NotificationPayload): Promise<void> {
    // Placeholder until Resend integration is implemented.
    logger.debug('[Notification:mock]', { userId, type, data });
  }
}
