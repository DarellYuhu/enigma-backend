import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  BadRequestException,
  ConflictException,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { PageService } from './page.service';
import { CreatePageDto } from './dto/create-page.dto';
import { AxiosError } from 'axios';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import {
  CreatePageResponseDto,
  GetAllPageResponseDto,
  GetPageByIdResponseDto,
} from './dto/page-response.dto';
import { ResponseInterceptor } from 'src/response/response.interceptor';
import { Prisma } from '@prisma/client';

@UseInterceptors(ResponseInterceptor)
@Controller('page')
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @ApiCreatedResponse({ type: CreatePageResponseDto })
  @Post()
  async create(@Body() createPageDto: CreatePageDto) {
    try {
      return await this.pageService.create(createPageDto);
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data);
        throw new BadRequestException('Invalid Page ID or Access Token');
      } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new ConflictException('Page Already Exists');
      } else throw error;
    }
  }

  @ApiOkResponse({ type: GetAllPageResponseDto })
  @Get()
  findAll(@Query() query: { date?: string }) {
    const date = query.date?.split(',').map((date: string) => new Date(date));
    return this.pageService.findAll(date);
  }

  @Get('trigger')
  trigger() {
    return this.pageService.trigger();
  }

  @ApiOkResponse({ type: GetPageByIdResponseDto })
  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: { date?: string }) {
    const date = query.date?.split(',').map((date: string) => new Date(date));
    return this.pageService.findOne(id, date);
  }

  // @Patch(':id')
  // update(@Param('id') _id: string, @Body() _updatePageDto: UpdatePageDto) {
  //   // return this.pageService.update(+id, updatePageDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.pageService.remove(+id);
  // }
}
