import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateNameDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  name: string;
}
