import { Meta } from "../meta";
import { AdMetricsResponse } from "../../interfaces/meta-response";
import { differenceInDays } from "date-fns";
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

  public async getDayPaidReaches(startDate: Date, endDate: Date) {
    const response = (
      await this.api.get<AdMetricsResponse>(`/${this.adAAccountId}/insights`, {
        params: {
          fields: "reach",
          access_token: this.pageAccessToken,
          ...this.generateSinceAndUntil(startDate, endDate),
        },
      })
    ).data.data;

    const result: { value: number }[] = [];

    const days = differenceInDays(endDate, startDate);

    for (let i = 0; i <= days; i++) {
      result.push({
        value: response[i]?.reach ?? 0,
      });
    }

    return result;
  }
}
