import { ApiVersion } from "./meta-auth";
import { PagePost } from "./meta-response";

export type ConstructorMain = {
  pageId: string;
  pageAccessToken: string;
  apiVersion: ApiVersion;
};

type PhotoMediaItem = {
  source: "url" | "path";
  value: string;
};

type VideoMediaItem = {
  source: "url" | "path";
  value: string;
};

export type CreatePost = {
  mediaType?: "photo" | "video";
  message?: string;
  publishNow: boolean;
  datePublish?: Date;
  photos?: PhotoMediaItem[];
  video?: VideoMediaItem;
};

type CreateStoriesPath = {
  mediaSource: "local";
  mediaType: "photo" | "video";
  path: string;
};

type CreateStoriesUrl = {
  mediaSource: "url";
  mediaType: "photo" | "video";
  url: string;
};

export type CreateStories = CreateStoriesPath | CreateStoriesUrl;

export interface IMetaPage {
  getAllPosts(): Promise<PagePost[]>;
  getPostUrlById(postId: string): string;
  createPost(data: CreatePost): Promise<string>;
  updatePost(postId: string, message: string): Promise<boolean>;
  deletePost(postId: string): Promise<boolean>;
  createStories(data: CreateStories): Promise<string>;
}
