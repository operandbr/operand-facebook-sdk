import { ConstructorMain } from "./meta";

export interface ConstructorIng extends ConstructorMain {
  ingId: string;
  typeToken?: "fb" | "ig";
}

export type PhotoMediaItem = {
  mediaType: "photo";
  source: "url";
  value: string;
};

export type VideoMediaItem = {
  mediaType: "video";
  source: "url" | "path";
  value: string;
};

export type Medias = PhotoMediaItem | VideoMediaItem;

export interface UserTag {
  username: string;
  x: number;
  y: number;
}

export type CreatePost = {
  medias: Medias[];
  caption?: string;
  coverUrl?: string;
  thumbOffset?: number;
  userTags?: UserTag;
  collaborators?: string[];
};

export type CreatePhotoStory = Medias & { userTags?: UserTag };

export type CreateVideoStory = Medias & { userTags?: UserTag };

export type CreateStories = Medias & { userTags?: UserTag };

export interface IIngPublish {
  createPost(data: CreatePost): Promise<string>;
  createStories(data: CreateStories): Promise<string>;
  getLinkPost(id: string): Promise<string>;
}

export interface saveMediaInMetaIngContainer {
  value: string;
  to: "REELS" | "STORIES" | "FEED";
  isCarouselItem?: boolean;
  caption?: string;
  coverUrl?: string;
  thumbOffset?: number;
  userTags?: UserTag;
  collaborators?: string[];
}
