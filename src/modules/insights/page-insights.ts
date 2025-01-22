import { ConstructorPage } from "../../interfaces/page-publish";
import {
  GetInsightsResponse,
  GetFollowersCountResponseCurrent,
  GetInsightsPageActionsPostReactionsTotalResponse,
  PostComment,
  GetPostCommentsResponse,
} from "../../interfaces/meta-response";
import { addDays, endOfDay, isSameDay, startOfDay, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { PageComments } from "../comments/page-comments";

export class PageInsights extends PageComments {
  constructor(constructorPage: ConstructorPage) {
    super(constructorPage);
  }

  private splitArrayPromises(
    arrayPromises: (() => Promise<void>)[],
    size: number,
  ) {
    const arrayPromisesSplited: (() => Promise<void>)[][] = [];

    for (let i = 0; i < arrayPromises.length; i += size) {
      arrayPromisesSplited.push(arrayPromises.slice(i, i + size));
    }

    return arrayPromisesSplited;
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

  public async getDayUnFollowersByDateInterval(startDate: Date, endDate: Date) {
    return (
      await this.api.get<GetInsightsResponse>(`/${this.pageId}/insights`, {
        params: {
          metric: "page_daily_unfollows_unique",
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
        `/${this.pageId}/insights/ `,
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

  public async getDayAllCommentsInAllPosts(startDate: Date, endDate: Date) {
    startDate = startOfDay(toZonedTime(startDate, "UTC"));
    endDate = endOfDay(toZonedTime(endDate, "UTC"));

    const allIds = (await this.getAllPosts()).map((post) => post.id);

    const values: PostComment[] = [];

    const arrayPromises = allIds.map((id) => {
      return async () => {
        let nextUrl = `${this.api.getUri()}/${id}/comments?order=reverse_chronological&access_token=${this.pageAccessToken}`;

        while (nextUrl) {
          const response = (await (
            await fetch(nextUrl)
          ).json()) as GetPostCommentsResponse;

          values.push(
            ...response.data.filter((value) => {
              const date = new Date(value.created_time);

              return date >= startDate && date <= endDate;
            }),
          );

          const isValidNext =
            response.paging?.next && this.isValidUrl(response.paging.next);

          const lastObjectDate = response.data[response.data.length - 1]
            ?.created_time
            ? new Date(response.data[response.data.length - 1].created_time)
            : null;

          if (
            !isValidNext ||
            !response.data.length ||
            (lastObjectDate >= startDate && lastObjectDate <= endDate)
          ) {
            nextUrl = "";
            break;
          }

          nextUrl = response.paging.next;
        }
      };
    });

    const splitArrayPromises = this.splitArrayPromises(arrayPromises, 50);

    for (const arrayPromises of splitArrayPromises) {
      await Promise.all(arrayPromises.map((promise) => promise()));
    }

    const qtdDays = subDays(endDate, startDate.getDate()).getDate();

    const valuesNumber: number[] = [];

    for (let i = 0; i <= qtdDays; i++) {
      const currentDay = addDays(startDate, i);

      const comments = values.filter((value) => {
        const date = new Date(value.created_time);

        return isSameDay(date, currentDay);
      });

      valuesNumber.push(comments.length);
    }

    return valuesNumber;
  }

  public async getDayEngagementInAllPosts(startDate: Date, endDate: Date) {
    startDate = subDays(toZonedTime(startDate, "UTC"), 1);
    endDate = toZonedTime(endDate, "UTC");

    return (
      await this.api.get<GetInsightsResponse>(`/${this.pageId}/insights`, {
        params: {
          metric: "page_post_engagements",
          period: "day",
          since: Math.floor(startDate.getTime() / 1000),
          until: Math.floor(endDate.getTime() / 1000),
          access_token: this.pageAccessToken,
        },
      })
    ).data.data[0].values;
  }
}
