import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private service: NotificationsService) {}
  @Get() findAll(@CurrentUser('id') userId: string, @Query('limit') limit?: number) { return this.service.findAll(userId, limit || 20); }
  @Get('unread-count') getUnreadCount(@CurrentUser('id') userId: string) { return this.service.getUnreadCount(userId); }
  @Patch(':id/read') markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) { return this.service.markAsRead(id, userId); }
  @Patch('read-all') markAllAsRead(@CurrentUser('id') userId: string) { return this.service.markAllAsRead(userId); }
}
