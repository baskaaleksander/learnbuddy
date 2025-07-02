import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { subscriptions, users } from 'src/database/schema';
import Stripe from 'stripe';

@Injectable()
export class WebhookService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    @Inject('DRIZZLE') private drizzle: typeof db,
  ) {
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
        await this.handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleCustomerSubscriptionDeleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object);
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
      console.log('Webhook verification successful!');
      return event;
    } catch (error) {
      console.error('Webhook verification error details:', {
        message: error.message,
        payload_length: payload.length,
        signature,
        secret_defined: !!stripeSecret,
      });
      throw new Error(
        `Webhook signature verification failed: ${error.message}`,
      );
    }
  }

  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const { customer_email } = session;

    if (!customer_email) {
      throw new Error('Customer email is required for subscription creation');
    }

    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.email, customer_email));

    if (user.length === 0) {
      throw new Error(`User with email ${customer_email} not found`);
    }

    const subscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    let plan: 'free' | 'tier1' | 'tier2' | 'unlimited' = 'tier1';

    if (session.metadata?.plan) {
      plan = session.metadata.plan as any;
    }

    const existingSubscription = await this.drizzle
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user[0].id));

    if (existingSubscription.length > 0) {
      await this.drizzle
        .update(subscriptions)
        .set({
          stripeSubscriptionId: subscription.id,
          plan: plan,
          status: 'active',
          currentPeriodEnd: new Date(
            subscription.items.data[0].current_period_end * 1000,
          ),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, user[0].id));
    } else {
      await this.drizzle.insert(subscriptions).values({
        userId: user[0].id,
        stripeSubscriptionId: subscription.id,
        plan: plan,
        status: 'active',
        currentPeriodEnd: new Date(
          subscription.items.data[0].current_period_end * 1000,
        ),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (!user[0].stripeCustomerId) {
      await this.drizzle
        .update(users)
        .set({
          stripeCustomerId: session.customer as string,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user[0].id));
    }
  }

  async handleCustomerSubscriptionDeleted(event: Stripe.Subscription) {
    const subscriptionId = event.id;

    if (!subscriptionId) {
      throw new Error('Subscription ID is required for deletion');
    }

    const subscription = await this.drizzle
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    if (subscription.length === 0) {
      throw new Error(`Subscription with ID ${subscriptionId} not found`);
    }

    await this.drizzle
      .delete(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    console.log(`Subscription with ID ${subscriptionId} deleted successfully`);
  }

  async handleInvoicePaid(event: Stripe.Invoice) {
    const subscriptionId = event.lines.data[0].parent?.subscription_item_details
      ?.subscription as string;

    if (!subscriptionId) {
      throw new Error('Subscription ID is required for invoice payment');
    }

    const subscription = await this.drizzle
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    if (subscription.length === 0) {
      throw new Error(`Subscription with ID ${subscriptionId} not found`);
    }

    await this.drizzle
      .update(subscriptions)
      .set({
        status: 'active',
        currentPeriodEnd: new Date(event.lines.data[0].period.end * 1000),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    console.log(`Invoice for subscription ${subscriptionId} paid successfully`);
  }
}
