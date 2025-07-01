import {
  Body,
  Controller,
  Headers,
  Header,
  NotFoundException,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { WebhookService } from './webhook.service';
import { CreateCheckoutSessionDto } from './dtos/create-checkout-session.dto';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly webhookService: WebhookService,
  ) {}

  @Post('webhook')
  @Header('content-type', 'application/json')
  handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    const payload = request.rawBody;

    if (!payload) {
      throw new NotFoundException('Request body is required');
    }

    return this.webhookService.handleWebhookEvent(payload, signature);
  }

  @Post('create-checkout-session')
  async createCheckoutSession(@Body() body: CreateCheckoutSessionDto) {
    return this.billingService.createCheckoutSession(
      body.email,
      body.priceId,
      body.plan,
    );
  }
}
