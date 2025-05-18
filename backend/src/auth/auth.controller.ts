import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { UserCredentialsDto } from './dtos/user-credentials.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { PayloadDto } from './dtos/payload.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth') 
export class AuthController {
    constructor(private authService: AuthService) {}
    @Post('register')
    async register(@Body() body: UserCredentialsDto, @Res() res: Response) {

        const registerRes = await this.authService.register(body);

        res.cookie('jwt', registerRes.access_token, {
            httpOnly: true,
            secure: false,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000,
        })

        return res.status(201).send({
            message: 'User created successfully',
            email: registerRes.email,
            id: registerRes.id,
            role: registerRes.role,
        })
    }

    @Post('login')
    async login(@Body() body: UserCredentialsDto, @Res() res: Response) {
        const loginRes = await this.authService.login(body);

        res.cookie('jwt', loginRes.access_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000,
        })

        return res.status(200).send({
            message: 'User logged in successfully',
            email: loginRes.email,
            id: loginRes.id,
            role: loginRes.role,
        })
    }

    @Post('logout')
    async logout(@Res() res: Response) {
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        })

        return res.status(200).send({
            message: 'User logged out successfully',
        })
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    async me(@CurrentUser() user: PayloadDto){
        return {
            email: user.email,
            id: user.id,
            role: user.role,
        };
    }

    @Post('verify-email/:emailVerificationToken')
    async verifyEmail(@Param('emailVerificationToken') emailVerificationToken: string) {
        return this.authService.verifyEmail(emailVerificationToken);
    }
    
}
