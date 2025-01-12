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

  private metricsNeed = [
    'page_follows',
    'page_fans',
    'page_post_engagements',
    'page_impressions',
    'page_video_views',
  ];

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
      .getTotalLifetimeMetrics(date?.[1])
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

    const groups = await this.pageRepository.getGroups().then((item) =>
      item.map(({ GroupPage, ...item }) => ({
        ...item,
        pageIds: GroupPage.map(({ pageId }) => pageId),
      })),
    );

    return {
      pages: normalizePages,
      metrics: Object.fromEntries([...metrics1, ...metrics2]),
      groups,
      demographic: Object.fromEntries(demographic),
      timeSeries,
    };
  }

  async findOne(id: string, date?: Date[]) {
    const page = await this.pageRepository.getPage(id, date);

    if (!page)
      throw new NotFoundException('Page you are looking for cannot be found');

    const { Metric, ...rest } = page;

    const aggregate = Metric.map((metric) => {
      let value = 0;
      if (metric.valueType === 'DAILY') {
        value = metric.Values.reduce((curr, acc) => curr + acc.value, value);
      } else value = metric.Values[0].value;
      return [metric.name, value];
    });

    const timeseries = Metric.map((metric) => {
      return [
        metric.name,
        metric.Values.sort(
          (a, b) =>
            Math.floor(new Date(a.end_time!).getTime() / 1000) -
            Math.floor(new Date(b.end_time!).getTime() / 1000),
        ),
      ];
    });

    return {
      ...rest,
      aggregate: Object.fromEntries(aggregate),
      timeseries: Object.fromEntries(timeseries),
    };
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
