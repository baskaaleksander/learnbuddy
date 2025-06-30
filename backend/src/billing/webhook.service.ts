import { Injectable, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class WebhookService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not defined in environment variables',
      );
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async processWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        break;
      case 'customer.subscription.deleted':
        break;
      case 'customer.subscription.updated':
        break;
      case 'invoice.paid':
        break;
      case 'invoice.payment_failed':
        break;
    }
  }

  async handleWebhookEvent(payload: Buffer, signature: string) {
    const event = this.verifyWebhookSignature(payload, signature);

    return this.processWebhookEvent(event);
  }

  verifyWebhookSignature(payload: Buffer, signature: string) {
    const stripeSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!stripeSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        stripeSecret,
      );
      return event;
    } catch (error) {
      throw new Error(
        `Webhook signature verification failed: ${error.message}`,
      );
    }
  }
}
