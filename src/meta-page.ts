import { AxiosInstance } from "axios";
import {
  ConstructorMain,
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
  CreateStartVideoUploadResponse,
  CreateFinishVideoUploadResponse,
} from "./interfaces/meta";
import { generateAxiosInstance } from "./utils/api";
import * as FileType from "file-type";
import * as fs from "node:fs";
import * as FormData from "form-data";
import { isAfter, isBefore, addMinutes, addMonths, getTime } from "date-fns";
import { OperandError } from "./error/operand-error";

export class MetaPage implements IMetaPage {
  private readonly pageAccessToken: string;
  private readonly pageId: string;
  private readonly api: AxiosInstance;
  private readonly apiVideo: AxiosInstance;

  constructor({ pageAccessToken, pageId, apiVersion }: ConstructorMain) {
    this.pageId = pageId;
    this.pageAccessToken = pageAccessToken;
    this.api = generateAxiosInstance(apiVersion);
    this.apiVideo = generateAxiosInstance(apiVersion, true);
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

  private validatePublishDate(datePublish: Date): boolean {
    const now = new Date();

    const tenMinutesFromNow = addMinutes(now, 10);
    const sixMonthsFromNow = addMonths(now, 6);

    return (
      isBefore(datePublish, tenMinutesFromNow) ||
      isAfter(datePublish, sixMonthsFromNow)
    );
  }

  private async savePhotoInMetaStorageByUrl(url: string): Promise<string> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    const fileType = await FileType.fromBuffer(arrayBuffer);

    if (!fileType) {
      throw new OperandError("Impossible to get the file type of file.");
    }

    if (!this.fileTypesPermitted("photo", fileType.ext)) {
      throw new OperandError(
        "This file type is not permitted. File types permitted: jpeg, bmp, png, gif, tiff.",
      );
    }

    if (!(await this.verifyPhotoSize(Buffer.from(arrayBuffer), true))) {
      throw new OperandError("The photo must be less or equal to 4MB.");
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
      throw new OperandError("Impossible to get the file type of file.");
    }

    if (!this.fileTypesPermitted("photo", fileType.ext)) {
      throw new OperandError(
        "This file type is not permitted. File types permitted: jpeg, bmp, png, gif, tiff.",
      );
    }

    if (!(await this.verifyPhotoSize(path, false))) {
      throw new OperandError("The photo must be less or equal to 4MB.");
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

  private async saveVideoInMetaStorageMomentaryByUrl(
    video: string,
  ): Promise<string> {
    const {
      data: { upload_url, video_id },
    } = await this.api.post<CreateStartVideoUploadResponse>(
      `${this.pageId}/video_stories`,
      {
        upload_phase: "start",
        access_token: this.pageAccessToken,
      },
    );

    await fetch(upload_url, {
      method: "POST",
      body: JSON.stringify({
        file_url: video,
      }),
      headers: {
        Authorization: `OAuth ${this.pageAccessToken}`,
        file_url: video,
      },
    });

    return video_id;
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

  private async uploadPhotos(
    photos: Array<{ source: string; value: string }>,
  ): Promise<string[]> {
    return Promise.all(
      photos.map((photo) =>
        photo.source === "url"
          ? this.savePhotoInMetaStorageByUrl(photo.value)
          : this.savePhotoInMetaStorageByPath(photo.value),
      ),
    );
  }

  private async createTextPost(
    message: string,
    publishNow: boolean,
    datePublish?: Date,
  ): Promise<string> {
    const newPost = (
      await this.api.post<CreatePagePostResponse>(`/${this.pageId}/feed`, {
        access_token: this.pageAccessToken,
        message,
        ...(!publishNow && {
          scheduled_publish_time: Math.floor(getTime(datePublish) / 1000),
          published: publishNow,
        }),
      })
    ).data;

    return newPost.post_id || newPost.id;
  }

  private async createMediaPost(
    message: string,
    mediaIds: string[],
    publishNow: boolean,
    datePublish?: Date,
  ): Promise<string> {
    const newPost = (
      await this.api.post<CreatePagePostResponse>(`/${this.pageId}/feed`, {
        access_token: this.pageAccessToken,
        message,
        ...(!publishNow && {
          scheduled_publish_time: Math.floor(getTime(datePublish) / 1000),
          published: publishNow,
        }),
        attached_media: mediaIds.map((id) => ({
          media_fbid: id,
        })),
      })
    ).data;

    return newPost.post_id || newPost.id;
  }

  private async uploadVideo(
    video: { source: string; value: string },
    message: string,
    publishNow: boolean,
    datePublish?: Date,
  ): Promise<string> {
    if (video.source === "url") {
      const response = await fetch(video.value);
      const arrayBuffer = await response.arrayBuffer();
      const fileType = await FileType.fromBuffer(arrayBuffer);

      if (!fileType) {
        throw new OperandError("Impossible to get the file type of file.");
      }

      if (!this.fileTypesPermitted("video", fileType.ext)) {
        throw new OperandError(
          "This file type is not permitted. File types permitted: mp4.",
        );
      }

      if (!(await this.verifyPhotoSize(Buffer.from(arrayBuffer), true))) {
        throw new OperandError("The video must be less or equal to 4MB.");
      }

      const formData = new FormData();
      formData.append("description", message);
      formData.append("file_url", video.value);
      formData.append("access_token", this.pageAccessToken);

      if (!publishNow) {
        formData.append("published", "false");
        formData.append(
          "scheduled_publish_time",
          Math.floor(getTime(datePublish) / 1000),
        );
      }

      const newPost = await this.apiVideo.post<SaveMediaStorageResponse>(
        `/${this.pageId}/videos`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        },
      );

      return newPost.data.id;
    }

    throw new OperandError("Invalid video source.");
  }

  public async createPost(post: CreatePost): Promise<string> {
    const { message, publishNow, datePublish, mediaType } = post;

    if (!publishNow && !datePublish) {
      throw new OperandError(
        "You must provide the datePublish if you don't want to publish now.",
      );
    }

    if (!publishNow && this.validatePublishDate(new Date(datePublish))) {
      throw new OperandError(
        "The datePublish must be between 10 minutes from now and 6 months from now.",
      );
    }

    if (mediaType === "none") {
      return this.createTextPost(message, publishNow, datePublish);
    }

    if (mediaType === "photo") {
      const mediaIds = await this.uploadPhotos(post.photos);
      return this.createMediaPost(message, mediaIds, publishNow, datePublish);
    }

    if (mediaType === "video") {
      return this.uploadVideo(post.video, message, publishNow, datePublish);
    }

    throw new OperandError("Invalid media source.");
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
    if (story.mediaType === "photo") {
      return await this.createPhotoStory(story);
    } else if (story.mediaType === "video") {
      return await this.createVideoStory(story);
    } else {
      throw new Error("Unsupported media type.");
    }
  }

  private async createPhotoStory(story: CreateStories): Promise<string> {
    const photoId =
      story.mediaSource === "url"
        ? await this.savePhotoInMetaStorageByUrl(story.url)
        : await this.savePhotoInMetaStorageByPath(story.path);

    const response = await this.api.post<CreatePhotoStoriesResponse>(
      `/${this.pageId}/photo_stories`,
      {
        access_token: this.pageAccessToken,
        photo_id: photoId,
      },
    );

    return response.data.post_id;
  }

  private async createVideoStory(story: CreateStories): Promise<string> {
    if (story.mediaSource === "url") {
      const videoId = await this.saveVideoInMetaStorageMomentaryByUrl(
        story.url,
      );

      const {
        data: { post_id },
      } = await this.api.post<CreateFinishVideoUploadResponse>(
        `${this.pageId}/video_stories`,
        {
          upload_phase: "finish",
          video_id: videoId,
          access_token: this.pageAccessToken,
        },
      );

      return post_id;
    }
  }
}
