import { Meta } from "../meta";
import { AdMetricsResponse } from "../../interfaces/meta-response";
import { differenceInDays, endOfDay, startOfDay } from "date-fns";
import { ConstructorMkt } from "../../interfaces/meta-mkt";

export class MktInsights extends Meta {
  protected readonly adAAccountId: string;

  constructor(constructorMkt: ConstructorMkt) {
    super(constructorMkt);
    this.adAAccountId = constructorMkt.adAAccountId;
  }

  public async getDayPaidReaches(startDate: Date, endDate: Date) {
    const response = (
      await this.api.get<AdMetricsResponse>(`/${this.adAAccountId}/insights`, {
        params: {
          fields: "reach",
          access_token: this.pageAccessToken,
          time_increment: "1",
          since: Math.floor(startOfDay(startDate).getTime() / 1000),
          until: Math.floor(endOfDay(endDate).getTime() / 1000),
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
