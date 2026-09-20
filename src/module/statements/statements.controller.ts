import {
  Controller,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth-guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { StatementsService } from './statements.service';
import { MAX_FILE_SIZE_BYTES } from './statements.constants';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';

@Controller('statements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatementsController {
  constructor(private readonly statementsService: StatementsService) {}

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.statementsService.getById(id);
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE_BYTES }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.statementsService.upload(user.userId, file);
  }
}
