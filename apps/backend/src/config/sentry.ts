import * as Sentry from '@sentry/node';
import { env } from './env';

let sentryEnabled = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: env.NODE_ENV,
    sendDefaultPii: false,
    beforeSend(event) {
      // Remove common PII fields if accidentally attached.
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
  });

  sentryEnabled = true;
}

export function captureSentryException(error: unknown): void {
  if (!sentryEnabled) return;
  Sentry.captureException(error);
}
