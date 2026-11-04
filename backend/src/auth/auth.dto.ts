import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(12) @MaxLength(200) password!: string;
}
export class RefreshTokenDto {
  @IsString() @MinLength(20) @MaxLength(4096) refreshToken!: string;
}
