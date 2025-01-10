import { Module } from '@nestjs/common';
import { PageActivityService } from './page-activity.service';
import { PageActivityController } from './page-activity.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [PageActivityController],
  providers: [PageActivityService, PrismaService],
})
export class PageActivityModule {}
