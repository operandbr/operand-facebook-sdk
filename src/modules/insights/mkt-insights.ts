import { Meta } from "../meta";
import { AdMetrics, AdMetricsResponse } from "../../interfaces/meta-response";
import { addDays } from "date-fns";
import { ConstructorMkt } from "../../interfaces/meta-mkt";
import { formatInTimeZone } from "date-fns-tz";

export class MktInsights extends Meta {
  protected readonly adAAccountId: string;

  constructor(constructorMkt: ConstructorMkt) {
    super(constructorMkt);
    this.adAAccountId = constructorMkt.adAAccountId;
  }

  private generateSinceAndUntil(startDate: Date, endDate: Date) {
    return {
      time_range: {
        since: formatInTimeZone(startDate, "UTC", "yyyy-MM-dd"),
        until: formatInTimeZone(endDate, "UTC", "yyyy-MM-dd"),
      },
    };
  }

  public async getDayPaidReaches(
    startDate: Date,
    endDate: Date,
    platform: string,
  ) {
    const reachArray: AdMetrics[] = [];
    let afterCursor: string | undefined = undefined;
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await this.api.get<AdMetricsResponse>(
        `/${this.adAAccountId}/insights`,
        {
          params: {
            ...this.generateSinceAndUntil(startDate, endDate),
            time_increment: 1,
            fields: "reach",
            breakdowns: "publisher_platform",
            access_token: this.pageAccessToken,
            filtering: [
              {
                field: "publisher_platform",
                operator: "IN",
                value: [platform],
              },
            ],
            after: afterCursor,
          },
        },
      );

      const { data, paging } = response.data;

      reachArray.push(...data);

      afterCursor = paging?.cursors?.after;
      hasNextPage = Boolean(afterCursor);
    }

    return reachArray.map((value, index) => ({
      [formatInTimeZone(addDays(startDate, index), "UTC", "yyyy-MM-dd")]:
        Number(value.reach || 0),
    }));
  }
}
