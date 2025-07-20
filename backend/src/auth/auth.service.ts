import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { passwordResets, users } from 'src/database/schema';
import { promisify } from 'util';
import { UserCredentialsDto } from './dtos/user-credentials.dto';
import { EmailService } from 'src/email/email.service';
import { UserRegisterDto } from './dtos/user-register.dto';
import { UserService } from '../user/user.service';
import { RedisService } from '../redis/redis.service';
import { Logger } from 'nestjs-pino';
import { ScheduledTaskService } from 'src/scheduled-task/scheduled-task.service';

const scrypt = promisify(_scrypt);

// TODO: Add proper logging
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject('DRIZZLE') private drizzle: typeof db,
    private emailService: EmailService,
    private userService: UserService,
    private redisService: RedisService,
    private logger: Logger,
    private readonly scheduledTaskService: ScheduledTaskService,
  ) {}

  async register(user: UserRegisterDto) {
    const existingUser = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.email, user.email));

    if (existingUser.length > 0) {
      throw new ConflictException('User already exists');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(user.password, salt, 32)) as Buffer;
    const result = salt + '.' + hash.toString('hex');

    const res = await this.drizzle
      .insert(users)
      .values({
        email: user.email,
        passwordHash: result,
        firstName: user.firstName,
      })
      .returning()
      .catch((err) => {
        throw new Error('Error creating user', err);
      });

    await this.scheduledTaskService.scheduleTask(
      res[0].id,
      'reset-tokens',
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    );

    const payload = {
      email: res[0].email,
      id: res[0].id,
      role: res[0].role,
      firstName: res[0].firstName,
      tokensUsed: res[0].tokensUsed,
    };

    await this.emailService.sendEmail(
      user.email,
      'Email Verification',
      `Please verify your email by clicking on this link: ${process.env.FRONTEND_URL}/verify-email/${res[0].emailVerificationToken}`,
    );

    this.logger.log(
      `User registered: ${user.email}, ID: ${res[0].id}`,
      'AuthService',
    );

    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
      }),
      email: res[0].email,
      id: res[0].id,
      role: res[0].role,
      firstName: res[0].firstName,
      tokensUsed: res[0].tokensUsed,
    };
  }

  async login(user: UserCredentialsDto) {
    const existingUser = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.email, user.email));

    if (existingUser.length === 0) {
      throw new ConflictException('User does not exist');
    }

    const [salt, key] = existingUser[0].passwordHash.split('.');
    const hash = (await scrypt(user.password, salt, 32)) as Buffer;

    if (key !== hash.toString('hex')) {
      throw new ConflictException('Invalid password');
    }

    const payload = {
      email: existingUser[0].email,
      id: existingUser[0].id,
      role: existingUser[0].role,
      firstName: existingUser[0].firstName,
      tokensUsed: existingUser[0].tokensUsed,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
      }),
      email: payload.email,
      id: payload.id,
      role: payload.role,
      firstName: payload.firstName,
      tokensUsed: payload.tokensUsed,
    };
  }

  async verifyEmail(emailVerificationToken: string) {
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, emailVerificationToken));

    if (user.length === 0) {
      throw new NotFoundException('Invalid email verification token');
    }

    if (user[0].emailVerified) {
      throw new ConflictException('Email already verified');
    }

    await this.drizzle
      .update(users)
      .set({
        emailVerified: true,
      })
      .where(eq(users.id, user[0].id))
      .returning();

    return {
      message: 'Email verified successfully',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (user.length === 0) {
      throw new NotFoundException('User does not exist');
    }

    const res = await this.drizzle
      .insert(passwordResets)
      .values({
        userId: user[0].id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      .returning()
      .catch((err) => {
        throw new Error('Error creating password reset token', err);
      });

    if (!res || res.length === 0) {
      throw new Error('Failed to create password reset token');
    }

    const token = res[0].token;

    await this.emailService.sendEmail(
      email,
      'Password Reset',
      `Please reset your password by clicking on this link: ${process.env.FRONTEND_URL}/reset-password/${token}`,
    );

    return {
      message: 'Password reset email sent',
    };
  }

  async checkPasswordResetToken(token: string) {
    const passwordReset = await this.drizzle
      .select()
      .from(passwordResets)
      .where(eq(passwordResets.token, token));

    if (passwordReset.length === 0) {
      throw new NotFoundException('Invalid password reset token');
    }

    if (passwordReset[0].expiresAt < new Date()) {
      throw new ConflictException('Password reset token expired');
    }

    if (passwordReset[0].used) {
      throw new ConflictException('Password reset token already used');
    }

    return {
      message: 'Password reset token valid',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const passwordReset = await this.drizzle
      .select()
      .from(passwordResets)
      .where(eq(passwordResets.token, token));

    if (passwordReset.length === 0) {
      throw new NotFoundException('Invalid password reset token');
    }

    if (passwordReset[0].expiresAt < new Date()) {
      throw new ConflictException('Password reset token expired');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(newPassword, salt, 32)) as Buffer;
    const result = salt + '.' + hash.toString('hex');

    await this.drizzle
      .update(users)
      .set({
        passwordHash: result,
      })
      .where(eq(users.id, passwordReset[0].userId))
      .returning();

    await this.drizzle
      .update(passwordResets)
      .set({
        used: true,
      })
      .where(eq(passwordResets.token, token))
      .returning();

    return {
      message: 'Password reset successfully',
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (user.length === 0) {
      throw new NotFoundException('User does not exist');
    }

    const res = await this.drizzle
      .insert(passwordResets)
      .values({
        userId: user[0].id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      .returning()
      .catch((err) => {
        throw new Error('Error creating password reset token', err);
      });

    if (!res || res.length === 0) {
      throw new Error('Failed to create password reset token');
    }

    const token = res[0].token;

    await this.emailService.sendEmail(
      email,
      'Password Reset',
      `Please reset your password by clicking on this link: ${process.env.FRONTEND_URL}/reset-password/${token}`,
    );

    return {
      message: 'Password reset email sent',
    };
  }

  async getMe(userId: string) {
    const key = `auth:me:${userId}`;
    const cached = await this.redisService.get<typeof result>(key);

    if (cached) return cached;

    const user = await this.userService.getUserById(userId);

    const result = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
      tokensUsed: user.tokensUsed,
    };

    await this.redisService.set(key, result, 300);

    return result;
  }
}
