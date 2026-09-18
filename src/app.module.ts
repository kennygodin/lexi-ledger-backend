import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './module/users/users.module';
import { AuthModule } from './module/auth/auth.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RefreshTokensModule } from './module/refresh-tokens/refresh-tokens.module';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import { envValidationSchema } from './config/env.validation';
import { PasswordResetTokensModule } from './module/password-reset-tokens/password-reset-tokens.module';
import { MailModule } from './module/mail/mail.module';
import { EmailVerificationTokensModule } from './module/email-verification-token/email-verification-tokens.module';

@Module({
  imports: [
    // read env vars via an injectable
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig],
      validationSchema: envValidationSchema,
    }),

    PrismaModule,
    UsersModule,
    AuthModule,
    RefreshTokensModule,
    PasswordResetTokensModule,
    EmailVerificationTokensModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
