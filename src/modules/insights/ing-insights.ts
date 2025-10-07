import { ConstructorIng } from "../../interfaces/ing-publish";
import {
  GetFollowersCountResponseCurrent,
  GetInsightsPageFollowersAndUnFollowersResponse,
  GetInsightsResponse,
} from "../../interfaces/meta-response";
import { addDays, endOfDay, subDays } from "date-fns";
import { IngComments } from "../comments/ing-comments";
import { formatInTimeZone } from "date-fns-tz";

export class IngInsights extends IngComments {
  constructor(constructorIng: ConstructorIng) {
    super({
      ...constructorIng,
      isInstagramApi: constructorIng.typeToken === "ig",
    });
  }

  private generateSinceAndUntil(startDate: Date, endDate: Date) {
    const nextDay = addDays(endDate, 1);

    return {
      since: formatInTimeZone(startDate, "UTC", "yyyy-MM-dd"),
      until: formatInTimeZone(nextDay, "UTC", "yyyy-MM-dd"),
    };
  }

  private async generateWhileLoopToGetLikesAndCommentsAndShares(
    startDate: Date,
    endDate: Date,
    metric: "likes" | "comments" | "shares",
  ): Promise<{ value: number; end_time?: string }[]> {
    const results: { value: number; end_time?: string }[] = [];

    let currentDate = startDate;

    while (currentDate <= endDate) {
      const response = await this.api.get<GetInsightsResponse>(
        `/${this.ingId}/insights`,
        {
          params: {
            metric,
            period: "day",
            metric_type: "total_value",
            ...this.generateSinceAndUntil(currentDate, currentDate),
            access_token: this.pageAccessToken,
          },
        },
      );

      const value = response.data.data[0]?.total_value?.value || 0;
      const endTime = response.data.data[0]?.values?.[0]?.end_time;

      results.push({ value, end_time: endTime });

      currentDate = addDays(currentDate, 1);

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
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

    return response.data.data?.[0]?.values?.map((value, index) => ({
      [formatInTimeZone(addDays(startDate, index), "UTC", "yyyy-MM-dd")]:
        value.value,
    }));
  }

  public async getDayUnFollowersByTheLast30Days() {
    const endDate = endOfDay(subDays(new Date(), 1));
    const startDate = subDays(endDate, 25);

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

    return response.data.data?.[0]?.values?.map((value, index) => ({
      [formatInTimeZone(addDays(startDate, index), "UTC", "yyyy-MM-dd")]:
        value.value,
    }));
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
    const response = await this.api.get<GetInsightsResponse>(
      `/${this.ingId}/insights`,
      {
        params: {
          metric: "reach",
          period: "day",
          ...this.generateSinceAndUntil(startDate, endDate),
          access_token: this.pageAccessToken,
        },
      },
    );

    return response.data.data[0].values.map((value, index) => ({
      [formatInTimeZone(addDays(startDate, index), "UTC", "yyyy-MM-dd")]:
        value.value,
    }));
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
