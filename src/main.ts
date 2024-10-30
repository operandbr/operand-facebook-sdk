import { AxiosInstance } from "axios";
import {
  ConstructorMain,
  CreateMetaAuth,
  CreatePost,
  CreateStories,
  GetAccounts,
  IMetaPage,
} from "./interfaces/main";
import {
  DeletePagePostResponse,
  GetPageAccountsResponse,
  GetPagePostsResponse,
  SaveMediaStorageResponse,
  CreatePagePostResponse,
  UpdatePagePostResponse,
  PagePost,
  CreatePhotoStoriesResponse,
  CreateAccessTokenResponse,
} from "./interfaces/meta";
import { generateAxiosInstance } from "./utils/api";
import * as FileType from "file-type";
import * as fs from "node:fs";
import * as FormData from "form-data";
import * as path from "node:path";

export class MetaAuth {
  public static async createAccessToken({
    client_id,
    client_secret,
    redirect_uri,
    apiVersion,
    code,
  }: CreateMetaAuth): Promise<string> {
    const api = generateAxiosInstance(apiVersion);

    return (
      await api.post<CreateAccessTokenResponse>(`/oauth/access_token`, {
        client_id,
        client_secret,
        code,
        redirect_uri,
      })
    ).data.access_token;
  }
}

export class MetaPage implements IMetaPage {
  private readonly pageAccessToken: string;
  private readonly pageId: string;
  private readonly api: AxiosInstance;

  constructor({ pageAccessToken, pageId, apiVersion }: ConstructorMain) {
    this.pageId = pageId;
    this.pageAccessToken = pageAccessToken;
    this.api = generateAxiosInstance(apiVersion);
  }

  private fileTypesPermitted(file: "video" | "photo", type: string): boolean {
    if (file === "photo") {
      return ["jpeg", "bmp", "png", "gif", "tiff"].includes(type);
    }

    return ["mp4"].includes(type);
  }

  private async verifyPhotoSize(
    value: string | Buffer,
    isBuffer: boolean,
  ): Promise<boolean> {
    if (isBuffer) {
      return (value as Buffer).length / 1024 / 1024 <= 4;
    }

    const status = await fs.promises.stat(value as string);
    return status.size / 1024 / 1024 <= 4;
  }

  private async savePhotoInMetaStorageByUrl(url: string): Promise<string> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    const fileType = await FileType.fromBuffer(arrayBuffer);

    if (!fileType) {
      throw new Error("Impossible to get the file type of file.");
    }

    if (!this.fileTypesPermitted("photo", fileType.ext)) {
      throw new Error(
        "This file type is not permitted. File types permitted: jpeg, bmp, png, gif, tiff.",
      );
    }

    if (!(await this.verifyPhotoSize(Buffer.from(arrayBuffer), true))) {
      throw new Error("The photo must be less or equal to 4MB.");
    }

    return (
      await this.api.post<SaveMediaStorageResponse>(`/me/photos`, {
        published: false,
        access_token: this.pageAccessToken,
        url,
      })
    ).data.id;
  }

  private async savePhotoInMetaStorageByPath(path: string): Promise<string> {
    const fileType = await FileType.fromFile(path);

    if (!fileType) {
      throw new Error("Impossible to get the file type of file.");
    }

    if (!this.fileTypesPermitted("photo", fileType.ext)) {
      throw new Error(
        "This file type is not permitted. File types permitted: jpeg, bmp, png, gif, tiff.",
      );
    }

    if (!(await this.verifyPhotoSize(path, false))) {
      throw new Error("The photo must be less or equal to 4MB.");
    }

    const fileStream = fs.createReadStream(path);

    const formData = new FormData();
    formData.append("published", "false");
    formData.append("access_token", this.pageAccessToken);
    formData.append("source", fileStream);

    const response = await this.api.post<SaveMediaStorageResponse>(
      `/me/photos`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      },
    );

    return response.data.id;
  }

  public async getAccounts({ fields }: GetAccounts): Promise<any> {
    return (
      await this.api.get<GetPageAccountsResponse>(`/${this.pageId}`, {
        params: {
          access_token: this.pageAccessToken,
          fields: fields.join(","),
        },
      })
    ).data.data;
  }

  public async getAllPosts(): Promise<PagePost[]> {
    return (
      await this.api.get<GetPagePostsResponse>(`/${this.pageId}/feed`, {
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
      await this.api.post<CreatePagePostResponse>(`/${this.pageId}/feed`, {
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
      await this.api.post<UpdatePagePostResponse>(`/${postId}`, {
        access_token: this.pageAccessToken,
        message,
      })
    ).data.success;
  }

  public async deletePost(postId: string): Promise<boolean> {
    return (
      await this.api.delete<DeletePagePostResponse>(`/${postId}`, {
        params: {
          access_token: this.pageAccessToken,
        },
      })
    ).data.success;
  }

  public async createStories(story: CreateStories): Promise<string> {
    if (story.midia === "photo") {
      const photoId =
        story.mediaSource === "url"
          ? await this.savePhotoInMetaStorageByUrl(story.url)
          : await this.savePhotoInMetaStorageByPath(story.path);

      return (
        await this.api.post<CreatePhotoStoriesResponse>(
          `/${this.pageId}/photo_stories`,
          {
            access_token: this.pageAccessToken,
            photo_id: photoId,
          },
        )
      ).data.post_id;
    }

    throw new Error("Only photo stories are supported at the moment.");
  }
}

(async () => {
  try {
    const page = new MetaPage({
      pageAccessToken:
        "EAAEG8x0DQWgBO09Eg9fYn0OEujdzOCelMSZBiKw3Dh0aKgLZBv3ZB3CGY7xZBiepq1wkfWy1b6ZCqcmVCEvjSkloz6DbzYiGnn9ydfHpW3ZBBS2Pzi3CtuOlwsTzHyIrlMqRq8wRC78F9E65LNZCSDcMPpcemx6iWyeHEc3y1onDe609PTjJrmKts7ufVISTgijZAlyNeZBFg1zblBdDlKKQB64ZBWUMUZBQaUZD",
      apiVersion: "v21.0",
      pageId: "252900751237310",
    });

    const createStories = await page.createStories({
      mediaSource: "local",
      midia: "photo",
      path: "https://svs.gsfc.nasa.gov/vis/a030000/a030000/a030028/frames/6750x3375_2x1_30p/split-750m/dnb_land_ocean_ice.2012.13500x13500.A1-0000.png",
    });

    console.log(createStories);
  } catch (error) {
    console.log(error?.response?.data || error);
  }
})();
