import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePageDto } from './dto/create-page.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FacebookService } from 'src/facebook/facebook.service';
import { format } from 'date-fns';
import { SchedulerService } from 'src/scheduler/scheduler.service';
import { PageRepository } from './page.repository';

@Injectable()
export class PageService {
  constructor(
    private prismaService: PrismaService,
    private facebookService: FacebookService,
    private schedulerService: SchedulerService,
    private pageRepository: PageRepository,
  ) {}

  async create(createPageDto: CreatePageDto) {
    const { access_token: longLivedUserToken } =
      await this.facebookService.generateUserLongLivedToken({
        ...createPageDto,
      });
    const { data } = await this.facebookService.generatePageLongLivedToken(
      createPageDto.appScopedUserId,
      longLivedUserToken,
    );

    const page = await this.prismaService.page.createMany({
      data: data.map((item) => ({
        ...createPageDto,
        id: item.id,
        name: item.name,
        pageLongLivedToken: item.access_token,
        userLongLivedToken: longLivedUserToken,
      })),
      skipDuplicates: true,
    });
    return page;
  }

  async findAll(date?: Date[]) {
    const pages = await this.pageRepository.getPages({
      from: date?.[0],
      to: date?.[1],
    });
    const normalizePages = pages.map(({ Metric, ...pages }) => ({
      ...pages,
      metrics: Object.fromEntries(
        Metric.map(({ Values, ...metric }) => {
          const sum =
            metric.valueType === 'LIFETIME'
              ? (Values[0]?.value ?? 0)
              : Values.reduce((a, b) => a + b.value, 0);
          return [metric.name, sum];
        }),
      ),
    }));

    const metrics1 = await this.pageRepository.getTotalMetrics({
      from: date?.[0],
      to: date?.[1],
    });
    const metrics2 = await this.pageRepository
      .getTotalLifetimeMetrics(date?.[2])
      .then((item) => {
        const group = Object.groupBy(item, (item) => item.name);
        return Object.entries(group).map(([key, value]) => {
          return [key, value?.reduce((a, b) => a + b.Values[0].value, 0)];
        });
      });

    const pagesDemographic = Object.groupBy(
      await this.pageRepository.getPagesDemographic(),
      (item) => item.name,
    );
    const demographic = Object.entries(pagesDemographic).map(([key, value]) => {
      const parsed = value?.map(
        (item) => item.DemographicValues[0]?.value as Record<string, number>,
      );
      const sum = parsed?.reduce((acc, obj) => {
        for (const key in obj) {
          acc[key] = (acc[key] || 0) + obj[key];
        }
        return acc;
      }, {});
      const arr = Object.entries(sum ?? {}).map(([key, value]) => ({
        key: key.split(',')[0],
        value,
      }));
      return [key, arr];
    });

    const timeSeries = await this.pageRepository
      .getTimeSeries()
      .then((data) => {
        const grouping = Object.groupBy(data, (item) => item.name);
        const sum = Object.entries(grouping).map(([key, value]) => {
          return [
            key,
            Object.entries(
              value
                ?.flatMap((item) => item.Values)
                .reduce(
                  (acc, item) => {
                    const end_time =
                      format(item.end_time!, 'yyyy-MM-dd') ?? 'Null';
                    acc[end_time] = (acc[end_time] || 0) + item.value;
                    return acc;
                  },
                  {} as Record<string, number>,
                ) ?? {},
            ).map(([key, value]) => ({ end_time: key, value })),
          ];
        });
        return Object.fromEntries(sum);
      });

    return {
      pages: normalizePages,
      metrics: Object.fromEntries([...metrics1, ...metrics2]),
      demographic: Object.fromEntries(demographic),
      timeSeries,
    };
  }

  async findOne(id: string) {
    const page = await this.prismaService.page.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isActive: true,
        Metric: {
          include: {
            Values: { select: { end_time: true, value: true } },
            DemographicValues: { select: { end_time: true, value: true } },
          },
        },
      },
    });
    if (!page) throw new NotFoundException('Page not found');
    const data = {
      ...page,
      Metric: Object.fromEntries(
        page.Metric.map(({ DemographicValues, Values, ...metric }) => [
          metric.name,
          {
            ...metric,
            value: Array.from(
              metric.type === 'DEMOGRAPHIC' ? DemographicValues : Values,
            ),
          },
        ]),
      ),
    };

    return data;
  }

  async trigger() {
    this.schedulerService.getFacebookDataJob();
    return 'success';
  }

  // update(id: number, _updatePageDto: UpdatePageDto) {
  //   return `This action updates a #${id} page`;
  // }

  remove(id: number) {
    return `This action removes a #${id} page`;
  }
}
