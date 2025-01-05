import { ConstructorPage } from "@/interfaces/page-publish";
import { PagePublish } from "../publish/page-publish";
import {
  GetInsightsResponse,
  GetFollowersCountResponseCurrent,
  GetInsightsPageActionsPostReactionsTotalResponse,
} from "../../interfaces/meta-response";

export class PageInsights extends PagePublish {
  constructor(constructorPage: ConstructorPage) {
    super(constructorPage);
  }

  public async getFollowersCountCurrent() {
    return (
      await this.api.get<GetFollowersCountResponseCurrent>(`/${this.pageId}`, {
        params: {
          fields: "followers_count",
          access_token: this.pageAccessToken,
        },
      })
    ).data.followers_count;
  }

  public async getDayFollowersByDateInterval(startDate: Date, endDate: Date) {
    return (
      await this.api.get<GetInsightsResponse>(`/${this.pageId}/insights`, {
        params: {
          metric: "page_follows",
          period: "day",
          since: Math.floor(startDate.getTime() / 1000),
          until: Math.floor(endDate.getTime() / 1000),
          access_token: this.pageAccessToken,
        },
      })
    ).data.data[0].values;
  }

  public async getDayAllImpressions(startDate: Date, endDate: Date) {
    return (
      await this.api.get<GetInsightsResponse>(`/${this.pageId}/insights`, {
        params: {
          metric: "page_impressions",
          period: "day",
          since: Math.floor(startDate.getTime() / 1000),
          until: Math.floor(endDate.getTime() / 1000),
          access_token: this.pageAccessToken,
        },
      })
    ).data.data[0].values;
  }

  public async getDayPaidImpressions(startDate: Date, endDate: Date) {
    return (
      await this.api.get<GetInsightsResponse>(`/${this.pageId}/insights`, {
        params: {
          metric: "page_impressions_paid",
          period: "day",
          since: Math.floor(startDate.getTime() / 1000),
          until: Math.floor(endDate.getTime() / 1000),
          access_token: this.pageAccessToken,
        },
      })
    ).data.data[0].values;
  }

  public async getDayLikesTypesInAllPosts(startDate: Date, endDate: Date) {
    const response =
      await this.api.get<GetInsightsPageActionsPostReactionsTotalResponse>(
        `/${this.pageId}/insights/page_actions_post_reactions_total`,
        {
          params: {
            period: "day",
            since: Math.floor(startDate.getTime() / 1000),
            until: Math.floor(endDate.getTime() / 1000),
            access_token: this.pageAccessToken,
          },
        },
      );

    return response.data.data[0].values.map(
      (value) =>
        value.anger +
        value.haha +
        value.like +
        value.love +
        value.sorry +
        value.wow,
    );
  }

  public async getTotalLikesTypesInAllPosts(startDate: Date, endDate: Date) {
    const values = await this.getDayLikesTypesInAllPosts(startDate, endDate);

    return values.reduce((acc, value) => acc + value, 0);
  }
}
