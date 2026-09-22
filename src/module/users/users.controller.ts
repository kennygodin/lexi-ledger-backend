import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth-guard';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateNameDto } from './dto/update-name.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.getMe(user.userId);
  }

  @Patch('me')
  updateName(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateNameDto,
  ) {
    return this.usersService.updateName(user.userId, dto.name);
  }
}
