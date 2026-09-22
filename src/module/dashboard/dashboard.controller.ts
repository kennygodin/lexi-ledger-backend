import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth-guard';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { OverviewDto } from './dto/overview.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Fetch income/expense totals and category breakdown',
  })
  getOverview(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: OverviewDto,
  ) {
    return this.dashboardService.getOverview(user.userId, query);
  }
}
