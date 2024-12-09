import { ConstructorMain } from "./meta";

export interface ConstructorIng extends ConstructorMain {
  ingId: string;
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

export type CreatePost = {
  caption?: string;
  medias: Medias[];
};

export type CreateStories = Medias;

export interface IMetaIng {
  createPost(data: CreatePost): Promise<string>;
  createStories(data: CreateStories): Promise<string>;
}
