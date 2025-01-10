import { ConflictException, Injectable } from '@nestjs/common';
import { CreatePageActivityDto } from './dto/create-page-activity.dto';
import { UpdatePageActivityDto } from './dto/update-page-activity.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PageActivityService {
  constructor(private prismaService: PrismaService) {}

  async create(createPageActivityDto: CreatePageActivityDto) {
    try {
      return await this.prismaService.pageActivity.create({
        data: createPageActivityDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new ConflictException('Page Activity Already Exists');
      }
    }
  }

  findAll() {
    return `This action returns all pageActivity`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pageActivity`;
  }

  update(id: number, _updatePageActivityDto: UpdatePageActivityDto) {
    return `This action updates a #${id} pageActivity`;
  }

  remove(id: number) {
    return `This action removes a #${id} pageActivity`;
  }
}
