import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './module/users/users.module';
import { AuthModule } from './module/auth/auth.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RefreshTokensModule } from './module/refresh-tokens/refresh-tokens.module';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import geminiConfig from './config/gemini.config';
import { envValidationSchema } from './config/env.validation';
import { PasswordResetTokensModule } from './module/password-reset-tokens/password-reset-tokens.module';
import { MailModule } from './module/mail/mail.module';
import { EmailVerificationTokensModule } from './module/email-verification-token/email-verification-tokens.module';
import { StatementsModule } from './module/statements/statements.module';
import { GeminiModule } from './module/gemini/gemini.module';
import { TransactionsModule } from './module/transactions/transactions.module';
import { DashboardModule } from './module/dashboard/dashboard.module';
import { BudgetsModule } from './module/budget/budgets.module';

@Module({
  imports: [
    // read env vars via an injectable
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, redisConfig, geminiConfig],
      validationSchema: envValidationSchema,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
        },
      }),
    }),

    PrismaModule,
    UsersModule,
    AuthModule,
    RefreshTokensModule,
    PasswordResetTokensModule,
    EmailVerificationTokensModule,
    MailModule,
    StatementsModule,
    GeminiModule,
    TransactionsModule,
    DashboardModule,
    BudgetsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
