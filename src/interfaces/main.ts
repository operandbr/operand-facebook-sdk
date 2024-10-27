import { PostItem } from "./meta";

export type ConstructorMain = {
  pageId: string;
  pageAccessToken: string;
  apiVersion: "v17.0" | "v18.0" | "v19.0" | "v20.0" | "v21.0";
};

export type CreatePost = {
  message: string;
  publishNow: boolean;
  scheduledPublishTimeUnix?: number;
  url?: string;
};

export interface IMain {
  getAllPosts(): Promise<PostItem[]>;
  getPostUrlById(postId: string): string;
  createPost(data: CreatePost): Promise<string>;
  updatePost(postId: string, message: string): Promise<boolean>;
  deletePost(postId: string): Promise<boolean>;

  saveMedia(media: any): Promise<string>;
}
