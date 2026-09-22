import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth-guard';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import { BudgetsService } from './budgets.service';
import { SetBudgetDto } from './dto/set-budget.dto';
import { TransactionCategory } from '../../generated/prisma/enums';
import { FindBudgetsDto } from './dto/find-budgets.dto';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: FindBudgetsDto,
  ) {
    return this.budgetsService.findAll(user.userId, query);
  }

  @Put(':category')
  set(
    @Param('category', new ParseEnumPipe(TransactionCategory))
    category: TransactionCategory,
    @Body() dto: SetBudgetDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.budgetsService.set(user.userId, category, dto.monthlyLimit);
  }

  @Delete(':category')
  remove(
    @Param('category', new ParseEnumPipe(TransactionCategory))
    category: TransactionCategory,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.budgetsService.remove(user.userId, category);
  }
}
