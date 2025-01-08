import { Meta } from "../meta";
import { AdMetricsResponse } from "@/interfaces/meta-response";
import { endOfDay, startOfDay } from "date-fns";
import { ConstructorMkt } from "@/interfaces/meta-mkt";

export class MktInsights extends Meta {
  protected readonly adAAccountId: string;

  constructor(constructorMkt: ConstructorMkt) {
    super(constructorMkt);
    this.adAAccountId = constructorMkt.adAAccountId;
  }

  public async getDayClicksInLink(startDate: Date, endDate: Date) {
    return (
      await this.api.get<AdMetricsResponse>(`/${this.adAAccountId}/insights`, {
        params: {
          fields: "clicks,inline_link_clicks,impressions,reach",
          access_token: this.pageAccessToken,
          time_increment: "1",
          since: Math.floor(startOfDay(startDate).getTime() / 1000),
          until: Math.floor(endOfDay(endDate).getTime() / 1000),
        },
      })
    ).data.data;
  }
}
