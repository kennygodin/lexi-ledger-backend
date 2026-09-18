import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AUTH_MESSAGES, ClientType, isClientType } from './auth.constants';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth-guard';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using the emailed code' })
  @ApiResponse({ status: 201, description: 'Password reset successful' })
  @ApiResponse({ status: 401, description: 'Invalid or expired code' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset code' })
  @ApiResponse({
    status: 201,
    description: 'If the email exists, a reset code was sent',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out of all sessions' })
  @ApiResponse({ status: 201, description: 'All sessions logged out' })
  async logoutAll(
    @CurrentUser() user: CurrentUserPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.userId);
    res.clearCookie('refreshToken');
    return { message: AUTH_MESSAGES.LOGOUT_ALL_SUCCESS };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out of the current session' })
  @ApiHeader({ name: 'x-client-type', required: true, enum: ['web', 'mobile'] })
  @ApiResponse({ status: 201, description: 'Logged out' })
  async logout(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const clientType = req.headers['x-client-type'];
    if (!isClientType(clientType)) {
      throw new BadRequestException(AUTH_MESSAGES.INVALID_CLIENT_TYPE);
    }

    const rawToken =
      clientType === ClientType.MOBILE
        ? dto.refreshToken
        : req.cookies?.refreshToken;

    if (rawToken) {
      await this.authService.logout(rawToken);
    }

    if (clientType === ClientType.WEB) {
      res.clearCookie('refreshToken');
    }

    return { message: AUTH_MESSAGES.LOGOUT_SUCCESS };
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Rotate refresh token and issue a new access token',
  })
  @ApiHeader({ name: 'x-client-type', required: true, enum: ['web', 'mobile'] })
  @ApiResponse({ status: 201, description: 'Token refreshed' })
  @ApiResponse({
    status: 401,
    description: 'Invalid, expired, or reused refresh token',
  })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const clientType = req.headers['x-client-type'];

    if (!isClientType(clientType)) {
      throw new BadRequestException(AUTH_MESSAGES.INVALID_CLIENT_TYPE);
    }

    const rawToken =
      clientType === ClientType.MOBILE
        ? dto.refreshToken
        : req.cookies?.refreshToken;

    if (!rawToken) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const result = await this.authService.refresh(rawToken);

    if (clientType === ClientType.MOBILE) {
      return {
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

    return { accessToken: result.accessToken };
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
