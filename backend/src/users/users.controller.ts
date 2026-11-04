import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CreateUserDto, ResetPasswordDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto, @Req() req: any) {
    return this.users.createForTenant(dto, req.user.tenantId);
  }

  @Post(':userId/reset-password')
  resetPassword(@Param('userId') userId: string, @Body() dto: ResetPasswordDto, @Req() req: any) {
    return this.users.adminResetPassword(userId, req.user.tenantId, dto.newTemporaryPassword);
  }
}
