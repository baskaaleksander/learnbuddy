import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { plans, subscriptions, users } from 'src/database/schema';
import { ScheduledTaskService } from 'src/scheduled-task/scheduled-task.service';
import Stripe from 'stripe';

@Injectable()
export class WebhookService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    @Inject('DRIZZLE') private drizzle: typeof db,
    private readonly scheduledTaskService: ScheduledTaskService,
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
        await this.handleSubscriptionUpdate(event.data.object);
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object);
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

    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeSecret,
    );

    return event;
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

    const plan = session.metadata?.planName;

    const planInterval = session.metadata?.planInterval;

    if (!plan || !planInterval) {
      throw new Error('Plan name and interval are required for subscription');
    }

    const planDetails = await this.drizzle
      .select()
      .from(plans)
      .where(and(eq(plans.name, plan), eq(plans.interval, planInterval)));

    const existingSubscription = await this.drizzle
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user[0].id));

    if (existingSubscription.length > 0) {
      await this.drizzle
        .update(subscriptions)
        .set({
          stripeSubscriptionId: subscription.id,
          planId: planDetails[0].id,
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
        planId: planDetails[0].id,
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

    await this.drizzle
      .update(users)
      .set({
        tokensUsed: 0,
      })
      .where(eq(users.id, user[0].id));

    await this.scheduledTaskService.destroyTask(user[0].id, 'reset-tokens');

    await this.scheduledTaskService.scheduleTask(
      user[0].id,
      'reset-tokens',
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    );
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

  async handleSubscriptionUpdate(event: Stripe.Subscription) {
    const subscriptionId = event.id;

    if (!subscriptionId) {
      throw new Error('Subscription ID is required for update');
    }

    const subscription = await this.drizzle
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    if (subscription.length === 0) {
      throw new Error(`Subscription with ID ${subscriptionId} not found`);
    }

    const planPriceId = event.items.data[0].plan.id;

    const currentPeriodEnd = new Date(
      event.items.data[0].current_period_end * 1000,
    );

    const planDetails = await this.drizzle
      .select()
      .from(plans)
      .where(eq(plans.price_id, planPriceId));

    if (planDetails.length === 0) {
      throw new Error('Plan details not found for the updated subscription');
    }

    //planID changed but currentPeriodEnd is the same
    await this.drizzle
      .update(subscriptions)
      .set({
        planId: planDetails[0].id,
        status: 'active',
        currentPeriodEnd: currentPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
  }

  async handleInvoicePaymentFailed(event: Stripe.Invoice) {
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
        status: 'past_due',
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    console.log(`Invoice for subscription ${subscriptionId} paid successfully`);
  }
}
