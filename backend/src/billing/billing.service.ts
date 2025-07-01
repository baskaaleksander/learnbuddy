import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { subscriptions, users } from 'src/database/schema';
import Stripe from 'stripe';

// TODO: wire up to database for user subs
@Injectable()
export class BillingService {
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

  async createCheckoutSession(email: string, priceId: string, plan: string) {
    const user = await this.drizzle
      .select()
      .from(users)
      .innerJoin(subscriptions, eq(users.id, subscriptions.userId))
      .where(eq(users.email, email));

    if (user.length === 0) {
      throw new NotFoundException('User not found');
    }

    const stripeCustomerId = user[0].users.stripeCustomerId;

    if (
      user[0].subscriptions.status === 'active' ||
      user[0].subscriptions.currentPeriodEnd > new Date()
    ) {
      throw new ConflictException('User already has an active subscription');
    }

    if (stripeCustomerId) {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        customer: stripeCustomerId,
        success_url: `${this.configService.get<string>('FRONTEND_URL')}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get<string>('FRONTEND_URL')}/cancel`,
        metadata: {
          plan: plan,
        },
      });

      return session.url;
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `${this.configService.get<string>('FRONTEND_URL')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get<string>('FRONTEND_URL')}/cancel`,
      metadata: {
        plan: plan,
      },
    });

    return session.url;
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.drizzle
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    if (subscription.length === 0) {
      throw new NotFoundException('Subscription not found for this user');
    }

    const subscriptionId = subscription[0]?.stripeSubscriptionId;

    const subscriptionStripe =
      await this.stripe.subscriptions.retrieve(subscriptionId);

    if (!subscriptionStripe) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscriptionStripe.status === 'canceled') {
      throw new ConflictException('Subscription is already canceled');
    }

    const canceledSubscription = await this.stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: true,
      },
    );

    await this.drizzle
      .update(subscriptions)
      .set({
        status: 'canceled',
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    return canceledSubscription;
  }

  async getSubscriptionStatus(subscriptionId: string) {
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return {
      id: subscription.id,
      status: subscription.status,
      days_until_due: subscription.days_until_due,
      plan: subscription.items.data[0].plan.nickname,
    };
  }

  async checkPricechangeAfterSubChange(userId: string, newPriceId: string) {
    const subscription = await this.drizzle
      .select()
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .where(eq(subscriptions.userId, userId));

    const prorationDate = Math.floor(Date.now() / 1000);

    if (subscription.length === 0) {
      throw new NotFoundException('Subscription not found for this user');
    }

    const subscriptionId = subscription[0]?.subscriptions.stripeSubscriptionId;
    const stripeCustomerId = subscription[0]?.users.stripeCustomerId;

    const subscriptionStripe =
      await this.stripe.subscriptions.retrieve(subscriptionId);

    if (!subscriptionStripe) {
      throw new NotFoundException('Subscription not found');
    }

    const prorationInvoice = await this.stripe.invoices.createPreview({
      customer: stripeCustomerId as string,
      subscription: subscriptionId,
      subscription_details: {
        items: [
          {
            id: subscriptionStripe.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_date: prorationDate,
      },
    });

    return {
      totalChange: prorationInvoice.total / 100, // Convert cents to dollars
      currency: prorationInvoice.currency,
      prorationDate: new Date(prorationDate * 1000),
    };
  }

  async updateSubscriptionPlan(subscriptionId: string, newPriceId: string) {
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const updatedSubscription = await this.stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
      },
    );

    return updatedSubscription;
  }
}
