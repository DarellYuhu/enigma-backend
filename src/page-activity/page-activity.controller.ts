import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PageActivityService } from './page-activity.service';
import { CreatePageActivityDto } from './dto/create-page-activity.dto';
import { UpdatePageActivityDto } from './dto/update-page-activity.dto';

@Controller('page-activities')
export class PageActivityController {
  constructor(private readonly pageActivityService: PageActivityService) {}

  @Post()
  create(@Body() createPageActivityDto: CreatePageActivityDto) {
    return this.pageActivityService.create(createPageActivityDto);
  }

  @Get()
  findAll() {
    return this.pageActivityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pageActivityService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePageActivityDto: UpdatePageActivityDto,
  ) {
    return this.pageActivityService.update(+id, updatePageActivityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pageActivityService.remove(+id);
  }
}
