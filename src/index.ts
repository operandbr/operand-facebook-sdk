import "dotenv/config";
import axios, { AxiosError, AxiosInstance } from "axios";
import { ConstructorMain, CreatePost, IMain } from "./interfaces/main";
import { GetStatusPosts, PostItem } from "./interfaces/meta";

export default class Main implements IMain {
  private readonly pageAccessToken: string;
  private readonly pageId: string;
  private readonly api: AxiosInstance;

  constructor({ pageAccessToken, pageId, apiVersion }: ConstructorMain) {
    this.pageId = pageId;
    this.pageAccessToken = pageAccessToken;
    this.api = axios.create({
      baseURL: `https://graph.facebook.com/${apiVersion}`,
    });
  }

  public async getAllPosts(): Promise<PostItem[]> {
    return (
      await this.api.get<GetStatusPosts>(`/${this.pageId}/feed`, {
        params: {
          access_token: this.pageAccessToken,
        },
      })
    ).data.data;
  }

  public getPostUrlById(postId: string): string {
    return `https://www.facebook.com/${this.pageId}/posts/${postId}`;
  }

  public async createPost({
    message,
    publishNow,
    scheduledPublishTimeUnix,
  }: CreatePost): Promise<string> {
    if (!publishNow && !scheduledPublishTimeUnix) {
      throw new Error(
        "You must provide the scheduledPublishTimeUnix if you don't want to publish now.",
      );
    }

    return (
      await this.api.post<{ id: string }>(`/${this.pageId}/feed`, {
        access_token: this.pageAccessToken,
        message,
        ...(!publishNow && {
          scheduled_publish_time: scheduledPublishTimeUnix,
          published: publishNow,
        }),
      })
    ).data.id;
  }
}

{
  const main = new Main({
    pageId: "252900751237310",
    apiVersion: "v21.0",
    pageAccessToken:
      "EAAEG8x0DQWgBO05feI3ZBdXeZAoFPiSciHjE5Irfh1HA3qTJtaxdWRT2uaK85ufoAXtuzXxQbLzKBxZBfdKsVTqeJDH1Lgklh7SBqv8vO1N0i2nOOkNjYMZBZAGSq2yAgbbpWlCwSKhW6mgxTB7zl5fZAwApMkbD5Y1bVcSnXMgYbEiuHuxBtXw2uqQ3gOoNBxUL62F6xRxnKLG9YXLKspZBMkqzVLFXroZD",
  });

  (async () => {
    try {
      // const posts = await main.getAllPosts();
      // console.log(posts);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const newPost = await main.createPost({
        message: "Hello, World!",
        publishNow: false,
        scheduledPublishTimeUnix: Math.floor(tomorrow.getTime() / 1000),
      });
      console.log(newPost);
    } catch (error) {
      console.log(error as AxiosError);
    }
  })();
}
