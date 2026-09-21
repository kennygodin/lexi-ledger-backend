import { IsEnum } from 'class-validator';
import { TransactionCategory } from '../../../generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';

export class CorrectionDto {
  @IsEnum(TransactionCategory)
  @ApiProperty({ example: 'rent', enum: TransactionCategory })
  category: TransactionCategory;
}
