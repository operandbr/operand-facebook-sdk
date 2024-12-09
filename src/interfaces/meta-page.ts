import { ConstructorMain } from "./meta";
import { PagePost } from "./meta-response";

export type PhotoMediaItem = {
  source: "url" | "path";
  value: string;
};

export type VideoMediaItem = {
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
  source: "path";
  mediaType: "photo" | "video";
  path: string;
};

type CreateStoriesUrl = {
  source: "url";
  mediaType: "photo" | "video";
  url: string;
};

export type CreateStories = CreateStoriesPath | CreateStoriesUrl;

type CreateReelsPath = {
  source: "path";
  path: string;
  title?: string;
  description?: string;
};

type CreateReelsUrl = {
  source: "url";
  url: string;
  title?: string;
  description?: string;
};

export type CreateReels = CreateReelsPath | CreateReelsUrl;

export interface ConstructorPage extends ConstructorMain {
  pageId: string;
}

export interface IMetaPage {
  getAllPosts(): Promise<PagePost[]>;
  getPostUrlById(postId: string): string;
  createPost(data: CreatePost): Promise<string>;
  updatePost(postId: string, message: string): Promise<boolean>;
  deletePost(postId: string): Promise<boolean>;
  createStories(data: CreateStories): Promise<string>;
  createReels(data: CreateReels): Promise<string>;
}
