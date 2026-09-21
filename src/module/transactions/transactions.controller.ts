import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth-guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('')
  @ApiOperation({ summary: 'Fetch all users transactions' })
  async listTransactions(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationDto,
  ) {
    return this.transactionsService.findAll(user.userId, query);
  }
}
