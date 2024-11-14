import { AxiosInstance } from "axios";
import {
  ConstructorMain,
  CreatePost,
  CreateReels,
  CreateStories,
  IMetaPage,
} from "../interfaces/meta-page";
import {
  DeletePagePostResponse,
  GetPagePostsResponse,
  SaveMediaStorageResponse,
  CreatePagePostResponse,
  UpdatePagePostResponse,
  PagePost,
  CreatePhotoStoriesResponse,
  CreateStartVideoUploadResponse,
  CreateFinishVideoUploadResponse,
} from "../interfaces/meta-response";
import { generateAxiosInstance } from "../utils/api";
import * as FileType from "file-type";
import * as fs from "node:fs";
import { default as FormData } from "form-data";
import { isAfter, isBefore, addMinutes, addMonths, getTime } from "date-fns";
import { OperandError } from "../error/operand-error";
import * as ffmpeg from "fluent-ffmpeg";
import * as path from "node:path";

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
      return ["jpeg", "bmp", "png", "gif", "tiff", "jpg"].includes(type);
    }

    return ["mp4"].includes(type);
  }

  private verifyClosedGOP(metadata: ffmpeg.FfprobeData): boolean {
    const videoStream = metadata.streams.find(
      (s: any) => s.codec_type === "video",
    );
    if (!videoStream) return false;

    const keyFrames = videoStream.tags?.key_frame_interval
      ?.split(",")
      .map(Number);
    if (!keyFrames || keyFrames.length < 2) return false;

    const gopIntervals = keyFrames
      .slice(1)
      .map((frame, index) => frame - keyFrames[index]);

    const frameRate = eval(videoStream.r_frame_rate); // Exemplo: "30/1" -> 30
    return gopIntervals.every(
      (interval) => interval / frameRate >= 2 && interval / frameRate <= 5,
    );
  }

  public async verifyVideoSpec(videoBuffer: Buffer): Promise<boolean> {
    const tempFilePath = path.resolve(
      __dirname,
      "..",
      "temp",
      `${Date.now()}.mp4`,
    );
    await fs.promises.writeFile(tempFilePath, videoBuffer);

    const textResponse = await new Promise<string>((resolve, reject) => {
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

        const validResolution =
          width && height && width >= 540 && height >= 960;

        if (!validResolution) {
          resolve(
            `Invalid resolution. The video must have at least 540x960. The current resolution is ${width}x${height}.`,
          );
        }

        const validFps = fps && fps >= 24 && fps <= 60;

        if (!validFps) {
          resolve(
            `Invalid fps. The video must have between 24 and 60 fps. The current fps is ${fps}.`,
          );
        }

        const validRatio = ratio <= 0.5625;

        if (!validRatio) {
          resolve(
            `Invalid ratio. The video must have a ratio of 0.56 or less. The current ratio is ${ratio}.`,
          );
        }

        const videoStream = metadata.streams.find(
          (s) => s.codec_type === "video",
        );
        const audioStream = metadata.streams.find(
          (s) => s.codec_type === "audio",
        );

        const videoChecks = {
          chromaSubsampling: videoStream?.pix_fmt === "yuv420p",
          closedGOP: this.verifyClosedGOP(metadata),
          compression: ["h264", "hevc", "vp9", "av1"].includes(
            videoStream?.codec_name ?? "",
          ),
          fixedFrameRate:
            videoStream?.avg_frame_rate === videoStream?.r_frame_rate,
          progressive: videoStream?.field_order === "progressive",
        };

        const audioChecks = {
          bitrate: parseInt(audioStream?.bit_rate ?? "0") >= 128000,
          channels: audioStream?.channels === 2,
          codec: audioStream?.codec_name === "aac",
          sampleRate: audioStream?.sample_rate === 48000,
        };

        if (
          !(
            Object.values(videoChecks).every(Boolean) &&
            Object.values(audioChecks).every(Boolean)
          )
        ) {
          resolve(
            "The video does not meet the requirements. The video must have the following characteristics: \n" +
              "Video: \n" +
              "- Chroma subsampling: yuv420p \n" +
              "- Closed GOP \n" +
              "- Compression: h264, hevc, vp9 or av1 \n" +
              "- Fixed frame rate \n" +
              "- Progressive \n" +
              "Audio: \n" +
              "- Bitrate: 128kbps or more \n" +
              "- Channels: 2 \n" +
              "- Codec: aac \n" +
              "- Sample rate: 48000",
          );
        }

        resolve("ok");
      });
    });

    fs.promises.unlink(tempFilePath);

    if (textResponse !== "ok") {
      throw new OperandError(textResponse);
    }

    return true;
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

    console.log({
      fileType,
    });

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
    to: "stories" | "reels",
  ): Promise<string> {
    const response = await fetch(video);
    const arrayBuffer = await response.arrayBuffer();
    const fileType = await FileType.fromBuffer(arrayBuffer);

    if (!fileType) {
      throw new OperandError("Impossible to get the file type of file.");
    }

    if (!this.fileTypesPermitted("video", fileType.ext)) {
      throw new OperandError(
        "This file type is not permitted. File types permitted: jpeg, bmp, png, gif, tiff.",
      );
    }

    // IN FUTURE, UNCOMMENT THIS LINE
    // await this.verifyVideoSpec(Buffer.from(arrayBuffer));

    const {
      data: { upload_url, video_id },
    } = await this.api.post<CreateStartVideoUploadResponse>(
      `${this.pageId}/${to === "stories" ? "video_stories" : "video_reels"}`,
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

      const { data } = await this.apiVideo.post<SaveMediaStorageResponse>(
        `/${this.pageId}/videos`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        },
      );

      return data.id;
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

    if (!mediaType && message) {
      return this.createTextPost(message, publishNow, datePublish);
    }

    if (mediaType === "photo") {
      const mediaIds = await this.uploadPhotos(post.photos);
      return this.createMediaPost(message, mediaIds, publishNow, datePublish);
    }

    if (mediaType === "video") {
      return this.uploadVideo(post.video, message, publishNow, datePublish);
    }

    throw new OperandError("Invalid parameters.");
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
    const videoId =
      story.mediaSource === "url"
        ? await this.saveVideoInMetaStorageMomentaryByUrl(story.url, "stories")
        : "";

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

  public async createStories(story: CreateStories): Promise<string> {
    if (story.mediaType === "photo") {
      return this.createPhotoStory(story);
    } else if (story.mediaType === "video") {
      return this.createVideoStory(story);
    } else {
      throw new Error("Unsupported media type.");
    }
  }

  public async createReels(story: CreateReels): Promise<string> {
    const videoId =
      story.mediaSource === "url"
        ? await this.saveVideoInMetaStorageMomentaryByUrl(story.url, "reels")
        : "";

    const {
      data: { post_id },
    } = await this.api.post<CreateFinishVideoUploadResponse>(
      `${this.pageId}/video_reels`,
      {},
      {
        params: {
          video_id: videoId,
          upload_phase: "finish",
          video_state: "PUBLISHED",
          description: story.description,
          title: story.title,
          access_token: this.pageAccessToken,
        },
      },
    );

    return post_id;
  }
}
