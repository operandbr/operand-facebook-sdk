import { ConstructorIng } from "@/interfaces/ing-publish";
import { IngPublish } from "./ing-publish";
import {
  GetFollowersCountResponseCurrent,
  GetInsightsResponse,
} from "../interfaces/meta-response";
import { addDays, differenceInDays } from "date-fns";

export class IngInsights extends IngPublish {
  constructor(constructorIng: ConstructorIng) {
    super(constructorIng);
  }

  private async generateWhileLoopToGetLikesAndCommentsAndShares(
    startDate: Date,
    endDate: Date,
    metric: "likes" | "comments" | "shares",
  ) {
    let value = 0;

    let currentStart = startDate;

    while (true) {
      const daysToAdd = Math.min(
        30,
        differenceInDays(endDate, currentStart) + 1,
      );

      const since = currentStart;
      const until = addDays(since, daysToAdd);

      const response = await this.api.get<GetInsightsResponse>(
        `/${this.ingId}/insights`,
        {
          params: {
            metric,
            period: "day",
            metric_type: "total_value",
            since,
            until,
            access_token: this.pageAccessToken,
          },
        },
      );

      value += response.data.data[0].total_value?.value || 0;

      if (differenceInDays(endDate, currentStart) + 1 <= 30) break;

      currentStart = addDays(currentStart, daysToAdd);
    }

    return value;
  }

  public async getFollowersCountCurrent() {
    return (
      await this.api.get<GetFollowersCountResponseCurrent>(`/${this.ingId}`, {
        params: {
          fields: "followers_count",
          access_token: this.pageAccessToken,
        },
      })
    ).data.followers_count;
  }

  public async getDayFollowersByDateInterval(startDate: Date, endDate: Date) {
    return (
      await this.api.get<GetInsightsResponse>(`/${this.ingId}/insights`, {
        params: {
          metric: "follows_and_unfollows",
          period: "day",
          metric_type: "total_value",
          since: Math.floor(startDate.getTime() / 1000),
          until: Math.floor(endDate.getTime() / 1000),
          access_token: this.pageAccessToken,
        },
      })
    ).data.data[0].values;
  }

  public async getDayAllImpressions(startDate: Date, endDate: Date) {
    const values: { value: number; end_time?: string }[] = [];

    let currentStart = startDate;

    while (values.length !== differenceInDays(endDate, startDate) + 1) {
      const daysToAdd = Math.min(
        30,
        differenceInDays(endDate, currentStart) + 1,
      );

      const since = currentStart;
      const until = addDays(since, daysToAdd);

      const response = await this.api.get<GetInsightsResponse>(
        `/${this.ingId}/insights`,
        {
          params: {
            metric: "impressions",
            period: "day",
            since,
            until,
            access_token: this.pageAccessToken,
          },
        },
      );

      values.push(...response.data.data[0].values);

      currentStart = addDays(currentStart, daysToAdd);
    }

    return values;
  }

  public async getTotalLikesInAllPosts(startDate: Date, endDate: Date) {
    return this.generateWhileLoopToGetLikesAndCommentsAndShares(
      startDate,
      endDate,
      "likes",
    );
  }

  public async getTotalCommentsInAllPosts(startDate: Date, endDate: Date) {
    return this.generateWhileLoopToGetLikesAndCommentsAndShares(
      startDate,
      endDate,
      "comments",
    );
  }

  public async getTotalSharesInAllPosts(startDate: Date, endDate: Date) {
    return this.generateWhileLoopToGetLikesAndCommentsAndShares(
      startDate,
      endDate,
      "shares",
    );
  }
}
