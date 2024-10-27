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
};

export interface IMain {
  getAllPosts(): Promise<PostItem[]>;
  createPost(data: CreatePost): Promise<string>;
  getPostUrlById(postId: string): string;
}
