import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GroupService {
  constructor(private prismaService: PrismaService) {}

  create({ pageIds, ...data }: CreateGroupDto) {
    return this.prismaService.group.create({
      data: {
        ...data,
        GroupPage: {
          createMany: { data: pageIds.map((pageId) => ({ pageId })) },
        },
      },
    });
  }

  findAll() {
    return this.prismaService.group.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} group`;
  }

  update(id: number, _updateGroupDto: UpdateGroupDto) {
    return `This action updates a #${id} group`;
  }

  remove(id: number) {
    return `This action removes a #${id} group`;
  }
}
