import { PagePost } from "./meta";

export type ApiVersion = "v17.0" | "v18.0" | "v19.0" | "v20.0" | "v21.0";

export type ConstructorMain = {
  pageId: string;
  pageAccessToken: string;
  apiVersion: ApiVersion;
};

export type CreateMetaAuth = {
  client_id: string;
  client_secret: string;
  redirect_uri?: string;
  apiVersion: ApiVersion;
  code: string;
};

export type GetAccounts = {
  fields: Array<
    | "id"
    | "name"
    | "about"
    | "category"
    | "category_list"
    | "location"
    | "fan_count"
    | "access_token"
    | "tasks"
    | "picture"
    | "cover"
    | "photos"
    | "videos"
    | "engagement"
    | "is_published"
    | "is_verified"
    | "verification_status"
    | "website"
    | "emails"
    | "phone"
    | "instagram_business_account"
    | "hours"
    | "created_time"
    | "bio"
    | "link"
    | "business"
  >;
  accessToken: string;
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
