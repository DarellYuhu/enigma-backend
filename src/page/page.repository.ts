import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PageRepository {
  constructor(private prismaService: PrismaService) {}
  private metricsNeed = [
    'page_follows',
    'page_fans',
    'page_post_engagements',
    'page_impressions',
    'page_video_views',
  ];

  getTimeSeries(query?: { from?: Date; to?: Date }) {
    return this.prismaService.metric.findMany({
      include: {
        Values: {
          where: {
            end_time: {
              gte: query?.to,
              lte: query?.from,
            },
          },
          orderBy: {
            end_time: 'asc',
          },
        },
      },
      where: {
        name: {
          in: [
            'page_daily_follows',
            'page_fan_adds',
            'page_views_total',
            'page_post_engagements',
            'page_impressions',
            'page_video_views',
            'page_video_complete_views_30s',
          ],
        },
      },
    });
  }

  getPages(query?: { from?: Date; to?: Date }) {
    return this.prismaService.page.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        Metric: {
          where: { name: { in: this.metricsNeed } },
          select: {
            name: true,
            Values: {
              select: { value: true },
              orderBy: { end_time: { sort: 'desc' } },
              where: {
                end_time: {
                  gte: query?.from,
                  lte: query?.to,
                },
              },
            },
            valueType: true,
          },
        },
      },
    });
  }

  getGroups() {
    return this.prismaService.group.findMany({
      include: {
        GroupPage: {
          select: { pageId: true },
        },
      },
    });
  }

  getPagesDemographic(lte?: Date) {
    return this.prismaService.metric.findMany({
      where: { type: 'DEMOGRAPHIC' },
      include: {
        DemographicValues: {
          where: {
            end_time: { lte },
          },
          take: 1,
          orderBy: { end_time: 'desc' },
        },
      },
    });
  }

  async getTotalMetrics(query?: { from?: Date; to?: Date }) {
    return this.prismaService.$queryRaw`
      SELECT m."name", SUM(v."value") as value 
      FROM "Metric" as m 
      FULL JOIN "Values" as v ON m."id" = v."metricId" 
      WHERE m."valueType" = 'DAILY'
      AND v."end_time" >= ${query?.from} AND v."end_time" <= ${query?.to}
      GROUP BY m."name" 
      ORDER BY m."name" ASC;
      `.then((data: { name: string; value: bigint }[]) =>
      data
        .filter((item) => this.metricsNeed.includes(item.name))
        .map((item) => [item.name, Number(item.value)]),
    );
  }

  getTotalLifetimeMetrics(lte?: Date) {
    return this.prismaService.metric.findMany({
      where: {
        valueType: 'LIFETIME',
        name: { in: this.metricsNeed },
      },
      include: {
        Values: {
          where: {
            end_time: {
              lte,
            },
          },
          orderBy: { end_time: { sort: 'desc' } },
          take: 1,
        },
      },
    });
  }

  getPage(id: string, date?: Date[]) {
    return this.prismaService.page.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isActive: true,
        Metric: {
          where: { name: { in: this.metricsNeed } },
          include: {
            Values: {
              where: { end_time: { gte: date?.[0], lte: date?.[1] } },
              orderBy: { end_time: { sort: 'desc' } },
              select: { end_time: true, value: true },
            },
            // DemographicValues: true,
          },
        },
      },
    });
  }
}
