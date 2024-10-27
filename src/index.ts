import axios, { AxiosError, AxiosInstance } from "axios";
import { ConstructorMain, CreatePost, IMain } from "./interfaces/main";
import {
  DeletePost,
  GetPosts,
  PostItem,
  PostPost,
  UpdatePost,
} from "./interfaces/meta";

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
      await this.api.get<GetPosts>(`/${this.pageId}/feed`, {
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
    url,
  }: CreatePost): Promise<string> {
    if (!publishNow && !scheduledPublishTimeUnix) {
      throw new Error(
        "You must provide the scheduledPublishTimeUnix if you don't want to publish now.",
      );
    }

    const post = (
      await this.api.post<PostPost>(`/${this.pageId}/feed`, {
        access_token: this.pageAccessToken,
        message,
        ...(!publishNow && {
          scheduled_publish_time: scheduledPublishTimeUnix,
          published: publishNow,
        }),
        ...(url && { url }),
      })
    ).data;

    return post.post_id || post.id;
  }

  public async updatePost(postId: string, message: string): Promise<boolean> {
    return (
      await this.api.post<UpdatePost>(`/${postId}`, {
        access_token: this.pageAccessToken,
        message,
      })
    ).data.success;
  }

  public async deletePost(postId: string): Promise<boolean> {
    return (
      await this.api.delete<DeletePost>(`/${postId}`, {
        params: {
          access_token: this.pageAccessToken,
        },
      })
    ).data.success;
  }
}

{
  const main = new Main({
    pageId: "252900751237310",
    apiVersion: "v21.0",
    pageAccessToken:
      "EAAEG8x0DQWgBO8ASf7WfC31p7m316LHHZB5jBtdbWO7DHEk5IN1AI9BbdWSlsFVCibkXqxrthM3ZBqpJdmeVnH5GXQZBU53aUMSLR5e1W3THojJXI8vNeYMc9nQxuQgDEUSqKK5BowfOA94utp0BlqcBa3k3n9FcFVkolZCry4UZBwAQpQsZAiZAlbZAdlhZBtW9FpaZAYhZBv1rHgqbnPRcbrT42vW3asosoIZD",
  });

  (async () => {
    try {
      // const posts = await main.getAllPosts();
      // console.log(posts);
      // const tomorrow = new Date();
      // tomorrow.setDate(tomorrow.getDate() + 1);
      // const newPost = await main.createPost({
      //   message: "Hello, World!",
      //   publishNow: false,
      //   scheduledPublishTimeUnix: Math.floor(tomorrow.getTime() / 1000),
      // });
      // console.log(newPost);
      // const url = main.getPostUrlById("252900751237310_122186207066230378");
      // console.log(url);
      // const updated = await main.updatePost(
      //   "252900751237310_122186208584230378",
      //   "Hello, World! Updated",
      // );
      // console.log(updated);
      const deleted = await main.deletePost(
        "252900751237310_122186207990230378",
      );
      console.log(deleted);
    } catch (error) {
      console.log(error as AxiosError);
    }
  })();
}
