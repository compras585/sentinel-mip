import { IsEmail, IsEnum, IsString, MinLength, MaxLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(12) @MaxLength(200) temporaryPassword!: string;
  @IsEnum(UserRole) role!: UserRole;
}
export class ResetPasswordDto {
  @IsString() @MinLength(12) @MaxLength(200) newTemporaryPassword!: string;
}
