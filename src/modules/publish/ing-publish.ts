import {
  ConstructorIng,
  CreatePost,
  CreateStories,
  IIngPublish,
  PhotoMediaItem,
  saveMediaInMetaIngContainer,
  VideoMediaItem,
} from "../../interfaces/ing-publish";
import { OperandError } from "../../error/operand-error";
import {
  GetStatusMediaContainerDownloadResponse,
  PostMediaContainerReelsResponse,
  SaveMediaStorageResponse,
} from "../../interfaces/meta-response";
import * as FileType from "file-type";
import * as fs from "node:fs";
import { MetaUtils } from "../utils/meta-utils";

export class IngPublish extends MetaUtils implements IIngPublish {
  protected readonly ingId: string;

  constructor({ apiVersion, ingId, pageAccessToken }: ConstructorIng) {
    super({ apiVersion, pageAccessToken });
    this.ingId = ingId;
  }

  private fileTypesPermitted(file: "video" | "photo", type: string): boolean {
    return file === "photo"
      ? ["jpeg", "jpg", "png", "gif", "BMP", "TIFF", "WEBP"].includes(type)
      : ["mp4", "avi", "flv", "mkv", "mov", "mpeg", "wmv"].includes(type);
  }

  private async verifyPhotoSize(
    value: string | Buffer,
    isBuffer: boolean,
  ): Promise<boolean> {
    if (isBuffer) {
      return (value as Buffer).length / 1024 / 1024 <= 8;
    }

    const status = await fs.promises.stat(value as string);
    return status.size / 1024 / 1024 <= 4;
  }

  private verifyStatusCodeContainerVideoDownload = async (id: string) => {
    let statusCodeContainer = 1;

    while (statusCodeContainer === 1) {
      const response =
        await this.api.get<GetStatusMediaContainerDownloadResponse>(`/${id}`, {
          params: {
            access_token: this.pageAccessToken,
            fields: "status_code",
          },
        });

      const status = response?.data?.status_code;

      if (status === "IN_PROGRESS") {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        continue;
      }

      if (status === "ERROR") {
        throw new OperandError({
          message: "Error on upload media",
        });
      }

      if (status === "FINISHED") {
        statusCodeContainer = 0;
      }
    }
  };

  private verifyVideoSize = async (
    value: string | Buffer,
    isBuffer: boolean,
  ): Promise<boolean> => {
    if (isBuffer) {
      return (value as Buffer).length / 1024 / 1024 / 1024 <= 1;
    }

    const status = await fs.promises.stat(value as string);
    return status.size / 1024 / 1024 / 1024 <= 1;
  };

  private savePhotoInMetaContainerByUrl = async ({
    to,
    value: url,
    isCarouselItem,
    caption,
    coverUrl,
    thumbOffset,
  }: saveMediaInMetaIngContainer): Promise<string> => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    const fileType = await FileType.fromBuffer(arrayBuffer);

    if (!fileType) {
      throw new OperandError({
        message: "Impossible to get the file type of file.",
      });
    }

    if (!this.fileTypesPermitted("photo", fileType.ext)) {
      throw new OperandError({
        message: "This file type is not permitted. File types permitted: jpeg.",
      });
    }

    if (!(await this.verifyPhotoSize(Buffer.from(arrayBuffer), true))) {
      throw new OperandError({
        message: "The photo must be less or equal to 8MB.",
      });
    }

    const containerId = (
      await this.api.post<SaveMediaStorageResponse>(
        `${this.ingId}/media`,
        undefined,
        {
          params: {
            image_url: url,
            ...(isCarouselItem ? { is_carousel_item: true } : {}),
            ...(to === "REELS" ? { media_type: "REELS" } : {}),
            ...(to === "STORIES" ? { media_type: "STORIES" } : {}),
            access_token: this.pageAccessToken,
            ...(caption ? { caption } : {}),
            ...(coverUrl ? { cover_url: coverUrl } : {}),
            ...(thumbOffset ? { thumb_offset: thumbOffset } : {}),
          },
        },
      )
    ).data.id;

    await this.verifyStatusCodeContainerVideoDownload(containerId);

    return containerId;
  };

  private saveVideoInMetaContainerByUrl = async ({
    to,
    value: url,
    caption,
    isCarouselItem,
    coverUrl,
    thumbOffset,
  }: saveMediaInMetaIngContainer): Promise<string> => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    const fileType = await FileType.fromBuffer(arrayBuffer);

    if (!fileType) {
      throw new OperandError({
        message: "Impossible to get the file type of file.",
      });
    }

    if (!this.fileTypesPermitted("video", fileType.ext)) {
      throw new OperandError({
        message: "Invalid file type. File types permitted: mp4, mov",
      });
    }

    if (!(await this.verifyVideoSize(Buffer.from(arrayBuffer), true))) {
      throw new OperandError({
        message: "The video must be less or equal to 1GB.",
      });
    }

    const containerId = (
      await this.api.post<SaveMediaStorageResponse>(
        `${this.ingId}/media`,
        undefined,
        {
          params: {
            video_url: url,
            access_token: this.pageAccessToken,
            ...(isCarouselItem ? { is_carousel_item: true } : {}),
            ...(["REELS", "FEED"].includes(to) ? { media_type: "REELS" } : {}),
            ...(to === "STORIES" ? { media_type: "STORIES" } : {}),
            ...(caption ? { caption } : {}),
            ...(coverUrl ? { cover_url: coverUrl } : {}),
            ...(thumbOffset ? { thumb_offset: thumbOffset } : {}),
          },
        },
      )
    ).data.id;

    await this.verifyStatusCodeContainerVideoDownload(containerId);

    return containerId;
  };

  private saveVideoInMetaContainerByPath = async ({
    to,
    value: path,
    caption,
    isCarouselItem,
    coverUrl,
    thumbOffset,
  }: saveMediaInMetaIngContainer): Promise<string> => {
    const arrayBuffer = await fs.promises.readFile(path);

    const fileType = await FileType.fromBuffer(arrayBuffer);

    if (!fileType) {
      throw new OperandError({
        message: "Impossible to get the file type of file.",
      });
    }

    if (!this.fileTypesPermitted("video", fileType.ext)) {
      throw new OperandError({
        message: "Invalid file type. File types permitted: mp4, mov",
      });
    }

    if (!(await this.verifyVideoSize(path, false))) {
      throw new OperandError({
        message: "The video must be less or equal to 1GB.",
      });
    }

    const {
      data: { id, uri },
    } = await this.api.post<PostMediaContainerReelsResponse>(
      `${this.ingId}/media`,
      undefined,
      {
        params: {
          ...(isCarouselItem ? { is_carousel_item: true } : {}),
          ...(["REELS", "FEED"].includes(to) ? { media_type: "REELS" } : {}),
          ...(to === "STORIES" ? { media_type: "STORIES" } : {}),
          upload_type: "resumable",
          access_token: this.pageAccessToken,
          ...(caption ? { caption } : {}),
          ...(coverUrl ? { cover_url: coverUrl } : {}),
          ...(thumbOffset ? { thumb_offset: thumbOffset } : {}),
        },
      },
    );

    const sessionStart = await fetch(uri, {
      method: "POST",
      headers: {
        Authorization: `OAuth ${this.pageAccessToken}`,
        offset: "0",
        file_size: String(arrayBuffer.byteLength),
      },
      body: arrayBuffer,
    });

    if (sessionStart.status !== 200) {
      throw new OperandError({
        message: "Error on upload video",
      });
    }

    await this.verifyStatusCodeContainerVideoDownload(id);

    return id;
  };

  private uploadPhotos = async (
    photos: PhotoMediaItem[],
  ): Promise<string[]> => {
    try {
      const medias = [];

      for (const photo of photos) {
        medias.push(
          await this.savePhotoInMetaContainerByUrl({
            value: photo.value,
            to: "FEED",
            isCarouselItem: true,
          }),
        );
      }

      return medias;
    } catch (error) {
      throw new OperandError({
        message: "Error when upload photos",
        error,
      });
    }
  };

  private uploadVideos = async (
    videos: VideoMediaItem[],
  ): Promise<string[]> => {
    try {
      const medias = [];

      for (const video of videos) {
        const data = {
          to: "FEED" as const,
          value: video.value,
          isCarouselItem: true,
        };

        medias.push(
          video.source === "url"
            ? await this.saveVideoInMetaContainerByUrl(data)
            : await this.saveVideoInMetaContainerByPath(data),
        );
      }

      return medias;
    } catch (error) {
      throw new OperandError({
        message: "Error when upload videos",
        error,
      });
    }
  };

  private createUniquePost = async (post: CreatePost): Promise<string> => {
    try {
      const { medias, caption, coverUrl, thumbOffset } = post;

      const containerId =
        medias[0].mediaType === "photo"
          ? await this.savePhotoInMetaContainerByUrl({
              value: medias[0].value,
              to: "FEED",
              caption,
              coverUrl,
              thumbOffset,
            })
          : medias[0].source === "url"
            ? await this.saveVideoInMetaContainerByUrl({
                to: "FEED",
                value: medias[0].value,
                caption,
                coverUrl,
                thumbOffset,
              })
            : await this.saveVideoInMetaContainerByPath({
                to: "FEED",
                value: medias[0].value,
                caption,
                coverUrl,
                thumbOffset,
              });

      await this.verifyStatusCodeContainerVideoDownload(containerId);

      return (
        await this.api.post<SaveMediaStorageResponse>(
          `/${this.ingId}/media_publish`,
          undefined,
          {
            params: {
              creation_id: containerId,
              access_token: this.pageAccessToken,
            },
          },
        )
      ).data.id;
    } catch (error) {
      throw new OperandError({
        message: "Error when upload create unique post",
        error,
      });
    }
  };

  private createCarrouselPost = async (post: CreatePost): Promise<string> => {
    try {
      const { caption, medias } = post;

      const photoIds = await this.uploadPhotos(
        medias.filter((m) => m.mediaType === "photo"),
      );

      const videoIds = await this.uploadVideos(
        medias.filter((m) => m.mediaType === "video"),
      );

      const media = [...photoIds, ...videoIds];

      const creationId = (
        await this.api.post<SaveMediaStorageResponse>(
          `${this.ingId}/media`,
          undefined,
          {
            params: {
              access_token: this.pageAccessToken,
              caption,
              children: media.join(","),
              media_type: "CAROUSEL",
            },
          },
        )
      ).data.id;

      await this.verifyStatusCodeContainerVideoDownload(creationId);

      return (
        await this.api.post(`${this.ingId}/media_publish`, undefined, {
          params: {
            creation_id: creationId,
            access_token: this.pageAccessToken,
          },
        })
      ).data.id;
    } catch (error) {
      throw new OperandError({
        message: "Error when upload create carrousel post",
        error,
      });
    }
  };

  public async createPost(post: CreatePost): Promise<string> {
    await this.createTempFolder();

    const { medias } = post;

    if (medias.length === 0) {
      throw new OperandError({
        message: "Medias is required",
      });
    }

    if (medias.length > 10) {
      throw new OperandError({
        message: "Medias must be less than or equal to 10",
      });
    }

    if (medias.length === 1) {
      return this.createUniquePost(post);
    }

    return this.createCarrouselPost(post);
  }

  private async createPhotoStory(photo: PhotoMediaItem): Promise<string> {
    try {
      const photoId = await this.savePhotoInMetaContainerByUrl({
        value: photo.value,
        to: "STORIES",
      });

      await this.verifyStatusCodeContainerVideoDownload(photoId);

      return (
        await this.api.post<SaveMediaStorageResponse>(
          `${this.ingId}/media_publish`,
          undefined,
          {
            params: {
              creation_id: photoId,
              access_token: this.pageAccessToken,
            },
          },
        )
      ).data.id;
    } catch (error) {
      throw new OperandError({
        message: "Error in create photo stories",
        error,
      });
    }
  }

  private async createVideoStory(video: VideoMediaItem): Promise<string> {
    try {
      const data = {
        to: "STORIES" as const,
        value: video.value,
      };

      const videoId =
        video.source === "url"
          ? await this.saveVideoInMetaContainerByUrl(data)
          : await this.saveVideoInMetaContainerByPath(data);

      await this.verifyStatusCodeContainerVideoDownload(videoId);

      return (
        await this.api.post<SaveMediaStorageResponse>(
          `${this.ingId}/media_publish`,
          undefined,
          {
            params: {
              creation_id: videoId,
              access_token: this.pageAccessToken,
            },
          },
        )
      ).data.id;
    } catch (error) {
      throw new OperandError({
        message: "Error in create video stories",
        error,
      });
    }
  }

  public async createStories(media: CreateStories): Promise<string> {
    await this.createTempFolder();

    if (!media) {
      throw new OperandError({
        message: "Media is required",
      });
    }

    if (media.mediaType === "photo") return this.createPhotoStory(media);

    return this.createVideoStory(media);
  }

  public async getLinkPost(id: string): Promise<string> {
    try {
      return (
        await this.api.get<{ permalink: string; id: string }>(`${id}`, {
          params: {
            fields: "permalink",
            access_token: this.pageAccessToken,
          },
        })
      ).data.permalink;
    } catch (error) {
      throw new OperandError({
        message: "Error in get link post",
        error,
      });
    }
  }
}
