import { ConstructorIng } from "../../interfaces/ing-publish";
import {
  GetFollowersCountResponseCurrent,
  GetInsightsPageFollowersAndUnFollowersResponse,
  GetInsightsResponse,
} from "../../interfaces/meta-response";
import {
  addDays,
  differenceInDays,
  endOfDay,
  startOfDay,
  subDays,
} from "date-fns";
import { IngComments } from "../comments/ing-comments";

export class IngInsights extends IngComments {
  constructor(constructorIng: ConstructorIng) {
    super(constructorIng);
  }

  private async generateWhileLoopToGetLikesAndCommentsAndShares(
    startDate: Date,
    endDate: Date,
    metric: "likes" | "comments" | "shares",
  ): Promise<{ value: number; end_time?: string }[]> {
    const value: { value: number; end_time?: string }[] = [];

    let currentStart = startDate;

    while (value.length !== differenceInDays(endDate, startDate) + 1) {
      const daysToAdd = 1;

      const since = startOfDay(currentStart);
      const until = endOfDay(currentStart);

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

      value.push({ value: response.data.data[0].total_value?.value || 0 });

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

  public async getDayFollowersByTheLast30Days() {
    const endDate = endOfDay(new Date());
    const startDate = subDays(endDate, 30);

    const response = await this.api.get<GetInsightsResponse>(
      `/${this.ingId}/insights`,
      {
        params: {
          metric: "follower_count",
          period: "day",
          since: Math.floor(startDate.getTime() / 1000),
          until: Math.floor(endDate.getTime() / 1000),
          access_token: this.pageAccessToken,
        },
      },
    );

    return response.data.data[0]?.values || [];
  }

  public async getDayUnFollowersByTheLast30Days() {
    const endDate = endOfDay(new Date());
    const startDate = subDays(endDate, 30);

    const response =
      await this.api.get<GetInsightsPageFollowersAndUnFollowersResponse>(
        `/${this.ingId}/insights`,
        {
          params: {
            metric: "follows_and_unfollows",
            metric_type: "total_value",
            period: "day",
            since: Math.floor(startDate.getTime() / 1000),
            until: Math.floor(endDate.getTime() / 1000),
            access_token: this.pageAccessToken,
          },
        },
      );

    return (
      response.data.data[0]?.values.map((value) => ({
        value: value.value.unfollows,
        end_time: value.end_time,
      })) || []
    );
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

  public async getDayAllLikesInAllPosts(startDate: Date, endDate: Date) {
    return this.generateWhileLoopToGetLikesAndCommentsAndShares(
      startDate,
      endDate,
      "likes",
    );
  }

  public async getDayAllCommentsInAllPosts(startDate: Date, endDate: Date) {
    return this.generateWhileLoopToGetLikesAndCommentsAndShares(
      startDate,
      endDate,
      "comments",
    );
  }

  public async getDayAllSharesInAllPosts(startDate: Date, endDate: Date) {
    return this.generateWhileLoopToGetLikesAndCommentsAndShares(
      startDate,
      endDate,
      "shares",
    );
  }

  public async getTotalLikesInAllPosts(startDate: Date, endDate: Date) {
    const values = await this.generateWhileLoopToGetLikesAndCommentsAndShares(
      startDate,
      endDate,
      "likes",
    );

    return values.reduce((acc, curr) => acc + curr.value, 0);
  }

  public async getTotalCommentsInAllPosts(startDate: Date, endDate: Date) {
    const values = await this.generateWhileLoopToGetLikesAndCommentsAndShares(
      startDate,
      endDate,
      "comments",
    );

    return values.reduce((acc, curr) => acc + curr.value, 0);
  }

  public async getTotalSharesInAllPosts(startDate: Date, endDate: Date) {
    const values = await this.generateWhileLoopToGetLikesAndCommentsAndShares(
      startDate,
      endDate,
      "shares",
    );

    return values.reduce((acc, curr) => acc + curr.value, 0);
  }

  public async getTotalInteractionsInAllPosts(startDate: Date, endDate: Date) {
    const likes = await this.getTotalLikesInAllPosts(startDate, endDate);
    const comments = await this.getTotalCommentsInAllPosts(startDate, endDate);
    const shares = await this.getTotalSharesInAllPosts(startDate, endDate);

    return likes + comments + shares;
  }
}
