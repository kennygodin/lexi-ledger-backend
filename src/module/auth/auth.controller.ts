import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AUTH_MESSAGES, ClientType, isClientType } from './auth.constants';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setRefreshTokenCookie(
    res: Response,
    refreshToken: string,
    expiresAt: Date,
  ) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('app.nodeEnv') === 'production',
      sameSite: 'strict',
      expires: expiresAt,
    });
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in and receive an access token' })
  @ApiHeader({
    name: 'x-client-type',
    description:
      'web (refresh token via httpOnly cookie) or mobile (refresh token in response body)',
    required: true,
    enum: ['web', 'mobile'],
  })
  @ApiOperation({ summary: 'Log in and receive an access token' })
  @ApiResponse({ status: 201, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const clientType = req.headers['x-client-type'];

    if (!isClientType(clientType)) {
      throw new BadRequestException(AUTH_MESSAGES.INVALID_CLIENT_TYPE);
    }

    const result = await this.authService.login({
      email: dto.email,
      password: dto.password,
    });

    if (clientType === ClientType.MOBILE) {
      return {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        refreshTokenExpiresAt: result.refreshTokenExpiresAt,
      };
    }

    this.setRefreshTokenCookie(
      res,
      result.refreshToken,
      result.refreshTokenExpiresAt,
    );

    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('register')
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });
  }
}
