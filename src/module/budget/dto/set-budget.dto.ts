import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class SetBudgetDto {
  @ApiPropertyOptional({ example: 20000 })
  @IsInt()
  @Min(1)
  monthlyLimit: number;
}
