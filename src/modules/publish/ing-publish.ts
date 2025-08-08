import {
  ConstructorIng,
  CreatePhotoStory,
  CreatePost,
  CreateStories,
  CreateVideoStory,
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
import * as path from "node:path";
import * as ffmpeg from "fluent-ffmpeg";

export class IngPublish extends MetaUtils implements IIngPublish {
  protected readonly ingId: string;

  constructor({
    apiVersion,
    ingId,
    pageAccessToken,
    typeToken,
  }: ConstructorIng) {
    super({
      apiVersion,
      pageAccessToken,
      isInstagramApi: typeToken === "ig",
    });
    this.ingId = ingId;
  }

  private fileTypesPermitted(file: "video" | "photo", type: string): boolean {
    return file === "photo"
      ? ["jpeg", "jpg", "png", "gif", "bmp", "tiff", "webp"].includes(type)
      : ["mp4", "avi", "flv", "mkv", "mov", "mpeg", "wmv"].includes(type);
  }

  public static async verifyVideoSpec(
    videoSource: Buffer | string,
    ext: string,
    to: "reels" | "post" | "stories",
  ): Promise<{
    success: boolean;
    warn?: {
      videoChecks: {
        chromaSubsampling: boolean;
        fixedFrameRate: boolean;
        progressive: boolean;
        ratio: boolean;
      };
      audioChecks: {
        bitrate: boolean;
        channels: boolean;
        sampleRate: boolean;
      };
    };
    error?: string;
  }> {
    let tempFilePath = "";

    const isBuffer = videoSource instanceof Buffer;

    if (isBuffer) {
      tempFilePath = path.resolve(
        __dirname,
        "..",
        "..",
        "temp",
        `${Date.now()}.${ext}`,
      );
      await fs.promises.writeFile(tempFilePath, videoSource);
    } else {
      tempFilePath = videoSource as string;
    }

    const videoSpecResponse = await new Promise<{
      success: boolean;
      warn?: {
        videoChecks: {
          chromaSubsampling: boolean;
          fixedFrameRate: boolean;
          progressive: boolean;
          ratio: boolean;
        };
        audioChecks: {
          bitrate: boolean;
          channels: boolean;
          sampleRate: boolean;
        };
      };
      error?: string;
    }>((resolve, reject) => {
      ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
        if (err) {
          reject(err);
        }

        const stream = metadata.streams.find((s) => s.width && s.height);

        const width = stream?.width;
        const height = stream?.height;
        const fpsString = stream?.avg_frame_rate;
        const fps = fpsString ? eval(fpsString) : 0;
        const ratio = width / height;
        const size = metadata.format.size;
        const duration = metadata.format.duration;

        const isStories = to === "stories";

        const validFps = fps && fps >= 23 && fps <= 60;

        if (!validFps) {
          resolve({
            success: false,
            error: `Invalid fps. The video must have between 23 and 60 fps. The current fps is ${fps}.`,
          });
        }

        const validSize = size < 1024 * 1024 * 1024;

        if (!validSize) {
          resolve({
            success: false,
            error: `Invalid size. The video must be a maximum of 10 gigabytes.`,
          });
        }

        const validDuration = isStories ? duration <= 60 : duration <= 900;

        if (!validDuration) {
          resolve({
            success: false,
            error: `Invalid duration. The video must be a maximum of ${isStories ? "60 seconds" : "900 minutes"}.`,
          });
        }

        const videoStream = metadata.streams.find(
          (s) => s.codec_type === "video",
        );
        const audioStream = metadata.streams.find(
          (s) => s.codec_type === "audio",
        );

        const validVideoCodec = ["h264", "hevc"].includes(
          videoStream?.codec_name ?? "",
        );

        const validAudioCodec = ["aac"].includes(audioStream?.codec_name ?? "");

        if (!validVideoCodec) {
          resolve({
            success: false,
            error: `Invalid codecs. The video must have the following video codecs: h264, hevc, vp9, av1`,
          });
        }

        if (!validAudioCodec) {
          resolve({
            success: false,
            error: `Invalid codecs. The video must be have aac audio codec`,
          });
        }

        const videoChecks = {
          chromaSubsampling: videoStream?.pix_fmt === "yuv420p",
          fixedFrameRate:
            videoStream?.avg_frame_rate === videoStream?.r_frame_rate,
          progressive:
            videoStream?.field_order === "progressive" ||
            videoStream.progressive === "1" ||
            videoStream.progressive === true ||
            (!videoStream.interlaced &&
              !videoStream.top_field_first &&
              !videoStream.bottom_field_first) ||
            videoStream.interlaced === "0" ||
            videoStream.interlaced === false,
          ratio: ratio <= 0.5625,
        };

        const audioChecks = {
          bitrate: parseInt(audioStream?.bit_rate ?? "0") >= 128000,
          channels: audioStream?.channels === 2,
          sampleRate: audioStream?.sample_rate === 48000,
        };

        resolve({
          success: true,
          warn: { videoChecks, audioChecks },
        });

        resolve({
          success: true,
        });
      });
    });

    if (isBuffer) await fs.promises.unlink(tempFilePath);

    return videoSpecResponse;
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
          message: "Media with problems",
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
    collaborators,
    userTags,
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
        message:
          "This file type is not permitted. File types permitted: jpeg, jpg, png, gif, bmp, tiff, webp",
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
            ...(userTags ? { user_tags: JSON.stringify(userTags) } : {}),
            ...(collaborators
              ? { collaborators: JSON.stringify(userTags) }
              : {}),
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
        message:
          "Invalid file type. File types permitted: mp4, avi, flv, mkv, mov, mpeg, wmv",
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
        message:
          "Invalid file type. File types permitted: mp4, avi, flv, mkv, mov, mpeg, wmv",
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
      const {
        medias,
        caption,
        coverUrl,
        thumbOffset,
        collaborators,
        userTags,
      } = post;

      const containerId =
        medias[0].mediaType === "photo"
          ? await this.savePhotoInMetaContainerByUrl({
              value: medias[0].value,
              to: "FEED",
              caption,
              coverUrl,
              thumbOffset,
              collaborators,
              userTags,
            })
          : medias[0].source === "url"
            ? await this.saveVideoInMetaContainerByUrl({
                to: "FEED",
                value: medias[0].value,
                caption,
                coverUrl,
                thumbOffset,
                collaborators,
                userTags,
              })
            : await this.saveVideoInMetaContainerByPath({
                to: "FEED",
                value: medias[0].value,
                caption,
                coverUrl,
                thumbOffset,
                collaborators,
                userTags,
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

  private async createPhotoStory(photo: CreatePhotoStory): Promise<string> {
    try {
      const photoId = await this.savePhotoInMetaContainerByUrl({
        value: photo.value,
        to: "STORIES",
        userTags: photo.userTags,
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

  private async createVideoStory(video: CreateVideoStory): Promise<string> {
    try {
      const data = {
        to: "STORIES" as const,
        value: video.value,
        userTags: video.userTags,
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
