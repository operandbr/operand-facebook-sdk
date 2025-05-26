import { ConstructorMain } from "../interfaces/meta";
import { generateAxiosInstance } from "../utils/api";
import { AxiosInstance } from "axios";
import * as fs from "fs";
import * as path from "path";

export class Meta {
  protected readonly pageAccessToken: string;
  protected readonly api: AxiosInstance;
  protected readonly apiVideo: AxiosInstance;
  protected readonly apiIng: AxiosInstance;

  protected async createTempFolder() {
    await fs.promises.mkdir(path.resolve(__dirname, "..", "temp"), {
      recursive: true,
    });
  }

  constructor({
    pageAccessToken,
    apiVersion,
    isInstagramApi,
  }: ConstructorMain) {
    this.pageAccessToken = pageAccessToken;
    this.api = generateAxiosInstance({
      apiVersion,
      isInstagramApi,
    });
    this.apiVideo = generateAxiosInstance({ apiVersion, isVideoApi: true });
  }
}
