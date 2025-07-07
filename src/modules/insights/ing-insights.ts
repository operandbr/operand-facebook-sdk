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
  getDate,
  getMonth,
  getYear,
  subDays,
} from "date-fns";
import { IngComments } from "../comments/ing-comments";

export class IngInsights extends IngComments {
  constructor(constructorIng: ConstructorIng) {
    super({
      ...constructorIng,
      isInstagramApi: constructorIng.connectByFb ? false : true,
    });
  }

  private generateSinceAndUntil(startDate: Date, endDate: Date) {
    return {
      since: `${getYear(startDate)}-${getMonth(startDate) + 1}-${getDate(startDate)}`,
      until: `${getYear(endDate)}-${getMonth(endDate) + 1}-${getDate(endDate) + 1}`,
    };
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

      const response = await this.api.get<GetInsightsResponse>(
        `/${this.ingId}/insights`,
        {
          params: {
            metric,
            period: "day",
            metric_type: "total_value",
            ...this.generateSinceAndUntil(startDate, endDate),
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
    const endDate = endOfDay(subDays(new Date(), 1));
    const startDate = subDays(endDate, 29);

    const response = await this.api.get<GetInsightsResponse>(
      `/${this.ingId}/insights`,
      {
        params: {
          metric: "follower_count",
          period: "day",
          ...this.generateSinceAndUntil(startDate, endDate),
          access_token: this.pageAccessToken,
        },
      },
    );

    const difference = differenceInDays(endDate, startDate);

    const values = response.data.data[0]?.values || [];

    const result: { value: number; end_time?: string }[] = [];

    for (let i = 0; i < difference; i++) {
      const date = addDays(startDate, i);

      const value = values[i]?.value || 0;

      result.push({ value, end_time: date.toISOString() });
    }

    return result;
  }

  public async getDayUnFollowersByTheLast30Days() {
    const endDate = endOfDay(subDays(new Date(), 1));
    const startDate = subDays(endDate, 29);

    const response =
      await this.api.get<GetInsightsPageFollowersAndUnFollowersResponse>(
        `/${this.ingId}/insights`,
        {
          params: {
            metric: "follows_and_unfollows",
            metric_type: "total_value",
            period: "day",
            ...this.generateSinceAndUntil(startDate, endDate),
            access_token: this.pageAccessToken,
          },
        },
      );

    const difference = differenceInDays(endDate, startDate);

    const values = response.data.data[0]?.values || [];

    const result: { value: number; end_time?: string }[] = [];

    for (let i = 0; i < difference; i++) {
      const date = addDays(startDate, i);

      const value = values[i]?.value.unfollows || 0;

      result.push({ value: value, end_time: date.toISOString() });
    }

    return result;
  }

  public async getDayAllViews(day: Date) {
    const since = day;
    const until = addDays(since, 1);

    const response = await this.api.get<GetInsightsResponse>(
      `/${this.ingId}/insights`,
      {
        params: {
          metric: "views",
          period: "day",
          metric_type: "total_value",
          ...this.generateSinceAndUntil(since, until),
          access_token: this.pageAccessToken,
        },
      },
    );

    return response.data.data[0].total_value.value || 0;
  }

  public async getDayAllReaches(startDate: Date, endDate: Date) {
    const response = (
      await this.api.get<GetInsightsResponse>(`/${this.ingId}/insights`, {
        params: {
          metric: "reach",
          period: "day",
          ...this.generateSinceAndUntil(startDate, endDate),
          access_token: this.pageAccessToken,
        },
      })
    ).data.data[0].values;

    return response;
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
