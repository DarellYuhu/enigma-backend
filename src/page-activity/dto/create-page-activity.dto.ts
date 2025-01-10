import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { IsDateString, IsNumber } from 'class-validator';

export class CreatePageActivityDto implements Prisma.PageActivityCreateInput {
  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2025-01-10T07:10:00.000Z',
  })
  @IsDateString()
  date: string | Date;

  @ApiProperty({ type: Number, example: 7 })
  @IsNumber()
  operations: number;
}
