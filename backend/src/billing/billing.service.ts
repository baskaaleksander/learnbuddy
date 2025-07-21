import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { materials, plans, subscriptions, users } from 'src/database/schema';
import { parsePublicPdfFromS3 } from 'src/helpers/parse-pdf';
import { RedisService } from 'src/redis/redis.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
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

  async createCheckoutSession(
    email: string,
    planName: string,
    planInterval: string,
  ) {
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (user.length === 0) {
      throw new NotFoundException('User not found');
    }

    const existingSubscription = await this.drizzle
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user[0].id));

    if (existingSubscription.length > 0) {
      if (
        existingSubscription[0].status === 'active' ||
        existingSubscription[0].currentPeriodEnd > new Date()
      ) {
        throw new ConflictException('User already has an active subscription');
      }
    }

    const stripeCustomerId = user[0]?.stripeCustomerId;

    const plan = await this.drizzle
      .select()
      .from(plans)
      .where(and(eq(plans.name, planName), eq(plans.interval, planInterval)));

    const priceId = plan[0]?.price_id;

    if (!priceId) {
      throw new NotFoundException('Plan not found');
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
          planName: planName,
          planInterval: planInterval,
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
        planName: planName,
        planInterval: planInterval,
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

  async getSubscriptionStatus(userId: string) {
    const userSubscription = await this.drizzle
      .select()
      .from(users)
      .innerJoin(subscriptions, eq(subscriptions.userId, users.id))
      .where(eq(users.id, userId));

    if (userSubscription.length === 0) {
      throw new NotFoundException('User not found or no subscription exists');
    }

    if (userSubscription[0].subscriptions.status !== 'active') {
      throw new ConflictException(
        'User does not have an active subscription to update',
      );
    }

    const subscriptionId =
      userSubscription[0].subscriptions.stripeSubscriptionId;

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

  async getUserSubscriptionData(userId: string) {
    const userSubscription = await this.drizzle
      .select()
      .from(users)
      .innerJoin(subscriptions, eq(subscriptions.userId, users.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(users.id, userId));

    if (userSubscription.length === 0) {
      return { planName: 'Free' };
    }
    return {
      planName: userSubscription[0].plans.name,
      planInterval: userSubscription[0].plans.interval,
      price: userSubscription[0].plans.price / 100,
      currency: 'USD',
      status: userSubscription[0].subscriptions.status,
      createdAt: userSubscription[0].subscriptions.createdAt,
      nextBillingDate: userSubscription[0].subscriptions.currentPeriodEnd,
      tokensUsed: userSubscription[0].users.tokensUsed || 0,
      tokensLimit: userSubscription[0].plans.tokens_monthly || 0,
    };
  }

  async checkPricechangeAfterSubChange(
    userId: string,
    planName: string,
    planInterval: string,
  ) {
    const subscription = await this.drizzle
      .select()
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .where(eq(subscriptions.userId, userId));

    const plan = await this.drizzle
      .select()
      .from(plans)
      .where(
        and(
          eq(plans.name, decodeURIComponent(planName)),
          eq(plans.interval, planInterval),
        ),
      );

    const prorationDate = Math.floor(Date.now() / 1000);

    if (subscription.length === 0) {
      return {
        totalChange: plan[0]?.price / 100,
        currency: 'USD',
        prorationDate: new Date(prorationDate * 1000),
      };
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
            price: plan[0]?.price_id,
          },
        ],
        proration_date: prorationDate,
        proration_behavior: 'always_invoice',
      },
    });

    return {
      totalChange: prorationInvoice.total / 100, // Convert cents to dollars
      currency: prorationInvoice.currency,
      prorationDate: new Date(prorationDate * 1000),
    };
  }

  async updateSubscriptionPlan(
    userId: string,
    planName: string,
    planInterval: string,
  ) {
    const userSubscription = await this.drizzle
      .select()
      .from(users)
      .innerJoin(subscriptions, eq(subscriptions.userId, users.id))
      .where(eq(users.id, userId));

    if (userSubscription.length === 0) {
      throw new NotFoundException('User not found or no subscription exists');
    }

    if (userSubscription[0].subscriptions.status !== 'active') {
      throw new ConflictException(
        'User does not have an active subscription to update',
      );
    }

    const newPlan = await this.drizzle
      .select()
      .from(plans)
      .where(and(eq(plans.name, planName), eq(plans.interval, planInterval)));

    if (newPlan.length === 0) {
      throw new NotFoundException('New plan not found');
    }

    const newPlanId = newPlan[0].id;
    const newPriceId = newPlan[0].price_id;

    if (!newPriceId) {
      throw new NotFoundException('New plan price ID not found');
    }

    if (userSubscription[0].subscriptions.planId === newPriceId) {
      throw new ConflictException(
        'User already has this plan, no update needed',
      );
    }

    const subscriptionId =
      userSubscription[0].subscriptions.stripeSubscriptionId;

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
        proration_behavior: 'always_invoice',
      },
    );

    await this.drizzle
      .update(subscriptions)
      .set({
        planId: newPlanId,
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    return updatedSubscription;
  }

  async useTokens(userId: string, tokenAmount: number) {
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (user.length === 0) {
      throw new NotFoundException('User not found');
    }

    const subscription = await this.drizzle
      .select()
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.userId, userId));

    if (subscription.length === 0) {
      if (user[0].tokensUsed + tokenAmount > 12) {
        throw new ConflictException(
          'Insufficient tokens available for this operation',
        );
      }

      await this.drizzle
        .update(users)
        .set({
          tokensUsed: user[0].tokensUsed + tokenAmount,
        })
        .where(eq(users.id, userId));

      await this.redisService.delete(`auth:me:${userId}`);

      return true;
    }

    if (
      user[0].tokensUsed + tokenAmount >
      subscription[0].plans.tokens_monthly
    ) {
      throw new ConflictException(
        'Insufficient tokens available for this operation',
      );
    }

    await this.drizzle
      .update(users)
      .set({
        tokensUsed: user[0].tokensUsed + tokenAmount,
      })
      .where(eq(users.id, userId));

    await this.redisService.delete(`auth:me:${userId}`);

    return true;
  }

  async getUserTokens(userId: string) {
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (user.length === 0) {
      throw new NotFoundException('User not found');
    }

    const subscription = await this.drizzle
      .select()
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.userId, userId));

    return {
      tokensUsed: user[0].tokensUsed || 0,
      tokensLimit: subscription[0].plans.tokens_monthly || 12,
    };
  }
}
