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

export type Midias = PhotoMediaItem | VideoMediaItem;

export type CreatePost = {
  caption?: string;
  midias: Midias[];
};

export interface IMetaIng {
  createPost(data: CreatePost): Promise<string>;
}
