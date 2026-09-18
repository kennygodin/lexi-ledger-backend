import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import {
  AUTH_MESSAGES,
  BCRYPT_SALT_ROUNDS,
  LOGIN_STATUS,
} from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import { PasswordResetTokensService } from '../password-reset-tokens/password-reset-tokens.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';
import { EmailVerificationTokensService } from '../email-verification-token/email-verification-tokens.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly passwordResetTokensService: PasswordResetTokensService,
    private readonly mailService: MailService,
    private readonly emailVerificationTokensService: EmailVerificationTokensService,
  ) {}

  async resetPassword(dto: ResetPasswordDto) {
    const verified = await this.passwordResetTokensService.verify(dto.token);
    if (!verified) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_RESET_TOKEN);
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);
    await this.usersService.updatePassword(verified.userId, passwordHash);
    await this.refreshTokensService.revokeAllForUser(verified.userId);

    return { message: AUTH_MESSAGES.RESET_SUCCESSFUL };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (user) {
      const { rawToken } = await this.passwordResetTokensService.issue(user.id);
      await this.mailService.sendPasswordResetEmail(user.email, rawToken);
    }

    return { message: AUTH_MESSAGES.FORGOT_PASSWORD_GENERIC };
  }

  async logoutAll(userId: string) {
    await this.refreshTokensService.revokeAllForUser(userId);
  }

  async logout(rawToken: string) {
    await this.refreshTokensService.revokeByRawToken(rawToken);
  }

  async refresh(rawToken: string) {
    const result = await this.refreshTokensService.validateAndRotate(rawToken);

    if (result.status !== 'valid') {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const user = await this.usersService.findById(result.userId);
    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken: result.rawToken,
      refreshTokenExpiresAt: result.expiresAt,
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (user && !user.emailVerifiedAt) {
      const { rawToken } = await this.emailVerificationTokensService.issue(
        user.id,
      );
      await this.mailService.sendVerificationEmail(user.email, rawToken);
    }

    // identical response regardless of whether the email exists or is already verified
    return { message: AUTH_MESSAGES.VERIFICATION_EMAIL_SENT_GENERIC };
  }

  async verifyEmail(rawToken: string) {
    const verified = await this.emailVerificationTokensService.verify(rawToken);
    if (!verified) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_VERIFICATION_TOKEN);
    }

    await this.usersService.markEmailAsVerified(verified.userId);
    return { message: AUTH_MESSAGES.EMAIL_VERIFIED };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.emailVerifiedAt) {
      const { rawToken } = await this.emailVerificationTokensService.issue(
        user.id,
      );
      await this.mailService.sendVerificationEmail(user.email, rawToken);
      return { status: LOGIN_STATUS.EMAIL_NOT_VERIFIED };
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });
    const { rawToken: refreshToken, expiresAt } =
      await this.refreshTokensService.issue(user.id);
    const { passwordHash: _passwordHash, ...safeUser } = user;

    return {
      status: LOGIN_STATUS.SUCCESS,
      user: safeUser,
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: expiresAt,
    };
  }

  async register(dto: RegisterDto) {
    const userExists = await this.usersService.findByEmail(dto.email);

    if (userExists) {
      throw new ConflictException(AUTH_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    const { rawToken } = await this.emailVerificationTokensService.issue(
      user.id,
    );
    await this.mailService.sendVerificationEmail(user.email, rawToken);

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return { message: AUTH_MESSAGES.CREATED, user: safeUser };
  }
}
