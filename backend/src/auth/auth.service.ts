import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { users } from 'src/database/schema';
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
        let payload
        let emailVerificationToken

        await this.drizzle
            .insert(users)
            .values({
                email: user.email,
                passwordHash: result,
            })
            .returning()
            .then((res) => {
                payload = {
                    email: res[0].email,
                    id: res[0].id,
                    role: res[0].role,
                };
                emailVerificationToken = res[0].emailVerificationToken;
                
            }
            )
            .catch((err) => {
                throw new Error('Error creating user', err);
            }
            );

            await this.emailService.sendEmail(user.email, 'Email Verification', `Please verify your email by clicking on this link: ${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`);
        
        return {
            access_token: this.jwtService.sign(payload, { secret: process.env.JWT_SECRET }),
            email: payload.email,
            id: payload.id,
            role: payload.role,
        };
    }

    async login(user: any) {

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
    
}
