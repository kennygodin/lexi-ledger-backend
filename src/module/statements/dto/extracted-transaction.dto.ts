import { IsEnum, IsISO8601, IsNumber, IsString, Max, Min } from 'class-validator';
import { TransactionCategory, TransactionType } from '../../../generated/prisma/enums';

export class ExtractedTransactionDto {
  @IsISO8601()
  date: string;

  @IsString()
  description: string;

  @IsNumber()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(TransactionCategory)
  category: TransactionCategory;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;
}
