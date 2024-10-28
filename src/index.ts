import axios, { AxiosInstance } from "axios";
import {
  ConstructorMain,
  CreatePost,
  CreateStories,
  IMain,
} from "./interfaces/main";
import {
  DeletePost,
  GetPosts,
  PostItem,
  PostMediaStorage,
  PostPhotoStories,
  PostPost,
  UpdatePost,
} from "./interfaces/meta";

export class Main implements IMain {
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

  public async saveMediaInMetStorageByUrl(url: any): Promise<string> {
    return (
      await this.api.post<PostMediaStorage>(`/me/photos`, {
        published: false,
        access_token: this.pageAccessToken,
        url,
      })
    ).data.id;
  }

  public async postStories({ photo_id }: CreateStories): Promise<string> {
    return (
      await this.api.post<PostPhotoStories>(`/${this.pageId}/photo_stories`, {
        access_token: this.pageAccessToken,
        photo_id,
      })
    ).data.post_id;
  }
}
