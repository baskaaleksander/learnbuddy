import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendEmailDto } from './dtos/send-email.dto';

@Controller('email')
export class EmailController {
    constructor(private readonly emailService: EmailService) {}

    @Post('send')
    async sendEmail(@Body() body: SendEmailDto) {
        return this.emailService.sendEmail(body.to, body.subject, body.text);
    }
}
