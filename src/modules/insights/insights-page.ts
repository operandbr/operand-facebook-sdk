import { ConstructorPage } from "@/interfaces/page-publish";
import { PagePublish } from "../publish/page-publish";
import {
  GetInsightsResponse,
  GetFollowersCountResponseCurrent,
  GetInsightsPageActionsPostReactionsTotalResponse,
} from "../../interfaces/meta-response";
import { endOfDay, startOfDay } from "date-fns";

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
          since: Math.floor(startOfDay(startDate).getTime() / 1000),
          until: Math.floor(endOfDay(endDate).getTime() / 1000),
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
          since: Math.floor(startOfDay(startDate).getTime() / 1000),
          until: Math.floor(endOfDay(endDate).getTime() / 1000),
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
          since: Math.floor(startOfDay(startDate).getTime() / 1000),
          until: Math.floor(endOfDay(endDate).getTime() / 1000),
          access_token: this.pageAccessToken,
        },
      })
    ).data.data[0].values;
  }

  public async getDayAllLikesTypesInAllPosts(startDate: Date, endDate: Date) {
    const response =
      await this.api.get<GetInsightsPageActionsPostReactionsTotalResponse>(
        `/${this.pageId}/insights/page_actions_post_reactions_total`,
        {
          params: {
            period: "day",
            since: Math.floor(startOfDay(startDate).getTime() / 1000),
            until: Math.floor(endOfDay(endDate).getTime() / 1000),
            access_token: this.pageAccessToken,
          },
        },
      );

    return response.data.data[0].values.map(
      (value) =>
        (value?.value.anger || 0) +
        (value?.value.haha || 0) +
        (value?.value.like || 0) +
        (value?.value.love || 0) +
        (value?.value.sorry || 0) +
        (value?.value.wow || 0),
    );
  }

  public async getTotalAllLikesTypesInAllPosts(startDate: Date, endDate: Date) {
    const values = await this.getDayAllLikesTypesInAllPosts(startDate, endDate);

    return values.reduce((acc, value) => acc + value, 0);
  }
}
