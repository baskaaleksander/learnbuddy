import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { join } from 'path';
import * as pug from 'pug';
import {
  PasswordResetEmailData,
  SendEmailInterface,
  WelcomeEmailData,
} from 'src/utils/types';

@Injectable()
export class EmailService {
  private transporter: Mail;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  private resolveEmailPath(): string {
    const distTemplates = join(__dirname, '..', 'assets', 'templates');
    if (existsSync(distTemplates)) return distTemplates;

    const srcTemplates = join(process.cwd(), 'src', 'assets', 'templates');
    return srcTemplates;
  }

  private renderTemplate(
    templateName: 'welcome' | 'password-reset',
    data: WelcomeEmailData | PasswordResetEmailData,
  ) {
    const templatePath = join(this.resolveEmailPath(), `${templateName}.pug`);

    return pug.renderFile(templatePath, data);
  }

  async sendEmail({ to, subject, template, data }: SendEmailInterface) {
    const html = this.renderTemplate(template, data);
    const mailOptions: Mail.Options = {
      from: `LearnBuddy <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email: ', error);
    }
    return {
      message: 'Email sent successfully',
    };
  }
}
