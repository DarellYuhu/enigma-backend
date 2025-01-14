import { ApiProperty } from '@nestjs/swagger';
import { $Enums, Prisma } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class CreateUserDto implements Prisma.UserCreateInput {
  @ApiProperty()
  @IsString()
  displayName: string;

  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty({
    enum: $Enums.Role,
    default: $Enums.Role.VIEWER,
  })
  @IsEnum($Enums.Role)
  role: $Enums.Role;
}
