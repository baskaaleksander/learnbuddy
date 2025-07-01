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

  //   async processWebhookEvent(event: Stripe.Event) {
  //     switch (event.type) {
  //       case 'checkout.session.completed':
  //         await this.handleCheckoutSessionCompleted(event);
  //         break;
  //     }
  //   }

  //   async handleWebhookEvent(payload: Buffer, signature: string) {
  //     const event = this.verifyWebhookSignature(payload, signature);

  //     return this.processWebhookEvent(event);
  //   }

  //   verifyWebhookSignature(payload: Buffer, signature: string) {
  //     const stripeSecret = this.configService.get<string>(
  //       'STRIPE_WEBHOOK_SECRET',
  //     );
  //     if (!stripeSecret) {
  //       throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
  //     }

  //     try {
  //       const event = this.stripe.webhooks.constructEvent(
  //         payload,
  //         signature,
  //         stripeSecret,
  //       );
  //       return event;
  //     } catch (error) {
  //       throw new Error(
  //         `Webhook signature verification failed: ${error.message}`,
  //       );
  //     }
  //   }

  //   async handleCheckoutSessionCompleted(event: Stripe.Event) {
  //     console.log(event.data.object);
  //   }
  // }

  async processWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object);
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

    console.log('Webhook Secret exists:', !!stripeSecret);
    console.log('Webhook Secret length:', stripeSecret?.length);
    console.log('Payload length:', payload.length);
    console.log('Signature:', signature);
    console.log('Payload first 100 chars:', payload.toString('utf8', 0, 100));

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
}
