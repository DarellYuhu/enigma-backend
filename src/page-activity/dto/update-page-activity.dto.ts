import { PartialType } from '@nestjs/swagger';
import { CreatePageActivityDto } from './create-page-activity.dto';

export class UpdatePageActivityDto extends PartialType(CreatePageActivityDto) {}
