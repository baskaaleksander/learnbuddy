import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { users } from 'src/database/schema';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService, @Inject('DRIZZLE') private drizzle: typeof db) {}

    async register(user: any) {

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
                
            }
            )
            .catch((err) => {
                throw new Error('Error creating user', err);
            }
            );

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
    
}
