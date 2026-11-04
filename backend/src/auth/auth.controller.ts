import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto, RefreshTokenDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login')
  login(@Body() dto: LoginDto) { return this.auth.login(dto.email.toLowerCase(), dto.password); }
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) { return this.auth.refresh(dto.refreshToken); }
  @Post('logout')
  logout(@Body() dto: RefreshTokenDto) { return this.auth.logout(dto.refreshToken); }
}
