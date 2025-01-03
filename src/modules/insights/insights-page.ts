import { ConstructorPage } from "@/interfaces/page-publish";
import { PagePublish } from "../publish/page-publish";
import {
  GetInsightsResponse,
  GetFollowersCountResponseCurrent,
  GetPostWithInsightsResponse,
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

  public async getTotalLikesInAllPosts(startDate: Date, endDate: Date) {
    const result = await this.api.get<GetPostWithInsightsResponse>(
      `/${this.pageId}/posts`,
      {
        params: {
          fields: "insights.metric(post_reactions_like_total)",
          since: Math.floor(startDate.getTime() / 1000),
          until: Math.floor(endDate.getTime() / 1000),
          access_token: this.pageAccessToken,
        },
      },
    );

    let count = 0;

    result.data.data.forEach((data) => {
      const valueOfLifetime = data.insights.data[0].values;

      const arrayOfValues = Object.values(valueOfLifetime[0].value);

      count += arrayOfValues.reduce((acc, value) => acc + value, 0);
    });

    return count;
  }
}
