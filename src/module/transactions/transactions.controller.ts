import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth-guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import { CorrectionDto } from './dto/correction.dto';
import { FindTransactionsDto } from './dto/find-transactions.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get(':id/corrections')
  @ApiOperation({ summary: 'Fetch correction history for a transaction' })
  async getCorrections(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.transactionsService.getCorrections(id, user.userId);
  }

  @Patch(':id/category')
  @ApiOperation({ summary: 'User to manually overide transaction category' })
  async correctTransaction(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CorrectionDto,
  ) {
    return this.transactionsService.correct(user.userId, {
      id,
      category: dto.category,
    });
  }

  @Get('')
  @ApiOperation({ summary: 'Fetch all users transactions' })
  async listTransactions(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: FindTransactionsDto,
  ) {
    return this.transactionsService.findAll(user.userId, query);
  }
}
