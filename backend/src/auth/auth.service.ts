import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { passwordResets, users } from 'src/database/schema';
import { promisify } from 'util';
import { UserCredentialsDto } from './dtos/user-credentials.dto';
import { EmailService } from 'src/email/email.service';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService, @Inject('DRIZZLE') private drizzle: typeof db, private emailService: EmailService) {}

    async register(user: UserCredentialsDto) {

        const existingUser = await this.drizzle
            .select()
            .from(users)
            .where(eq(users.email, user.email));

        if(existingUser.length > 0) {
            throw new ConflictException('User already exists');
        }

        const salt = randomBytes(8).toString('hex');
        const hash = await scrypt(user.password, salt, 32) as Buffer;
        const result = salt + '.' + hash.toString('hex');

        const res = await this.drizzle
            .insert(users)
            .values({
                email: user.email,
                passwordHash: result,
            })
            .returning()
            .catch((err) => {
                throw new Error('Error creating user', err);
            }
        );

        const payload = {
            email: res[0].email,
            id: res[0].id,
            role: res[0].role,
        };


        await this.emailService.sendEmail(user.email, 'Email Verification', `Please verify your email by clicking on this link: ${process.env.FRONTEND_URL}/verify-email/${res[0].emailVerificationToken}`);
        
        return {
            access_token: this.jwtService.sign(payload, { secret: process.env.JWT_SECRET }),
            email: res[0].email,
            id: res[0].id,
            role: res[0].role,
        };
    }

    async login(user: UserCredentialsDto) {

        const existingUser = await this.drizzle
            .select()
            .from(users)
            .where(eq(users.email, user.email));
        
        if(existingUser.length === 0) {
            throw new ConflictException('User does not exist');
        }

        const [salt, key] = existingUser[0].passwordHash.split('.');
        const hash = (await scrypt(user.password, salt, 32)) as Buffer;

        if(key !== hash.toString('hex')) {
            throw new ConflictException('Invalid password');
        }

        const payload = {
            email: existingUser[0].email,
            id: existingUser[0].id,
            role: existingUser[0].role,
        };

        return {
            access_token: this.jwtService.sign(payload, { secret: process.env.JWT_SECRET }),
            email: payload.email,
            id: payload.id,
            role: payload.role,
        };
    }

    async verifyEmail(emailVerificationToken: string) {
        const user = await this.drizzle
            .select()
            .from(users)
            .where(eq(users.emailVerificationToken, emailVerificationToken));

        if(user.length === 0) {
            throw new NotFoundException('Invalid email verification token');
        }

        if(user[0].emailVerified) {
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

        if(user.length === 0) {
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

        await this.emailService.sendEmail(email, 'Password Reset', `Please reset your password by clicking on this link: ${process.env.FRONTEND_URL}/reset-password/${token}`);

        return {
            message: 'Password reset email sent',
        };
    }
    
}
