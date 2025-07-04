import {
  Body,
  Controller,
  Headers,
  NotFoundException,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
  Get,
  Patch,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { WebhookService } from './webhook.service';
import { CreateCheckoutSessionDto } from './dtos/create-checkout-session.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { PayloadDto } from 'src/auth/dtos/payload.dto';
import { NewPlanDto } from './dtos/new-plan.dto';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly webhookService: WebhookService,
  ) {}

  @Post('webhook')
  webhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    const payload = request.rawBody;
    if (!payload) {
      throw new NotFoundException('Request body is required');
    }

    return this.webhookService.handleWebhookEvent(payload, signature);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Body() body: CreateCheckoutSessionDto,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.billingService.createCheckoutSession(
      user.email,
      body.planName,
      body.planInterval,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('cancel-subscription')
  async cancelSubscription(@CurrentUser() user: PayloadDto) {
    return this.billingService.cancelSubscription(user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('check-price-change')
  async checkPriceChange(
    @CurrentUser() user: PayloadDto,
    @Query('planName') planName: string,
    @Query('planInterval') planInterval: string,
  ) {
    return this.billingService.checkPricechangeAfterSubChange(
      user.id,
      planName,
      planInterval,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('get-user-subscription')
  async getUserSubscription(@CurrentUser() user: PayloadDto) {
    return this.billingService.getUserSubscriptionData(user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('update-subscription')
  async updateSubscription(
    @CurrentUser() user: PayloadDto,
    @Body() body: NewPlanDto,
  ) {
    return this.billingService.updateSubscriptionPlan(
      user.id,
      body.planName,
      body.planInterval,
    );
  }
}
