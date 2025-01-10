import { ApiProperty } from '@nestjs/swagger';
import { Group } from '@prisma/client';
import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class CreateGroupDto implements Group {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  pageIds: string[];
}
