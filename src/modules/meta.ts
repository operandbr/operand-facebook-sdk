import { ConstructorMain } from "../interfaces/meta";
import { generateAxiosInstance } from "../utils/api";
import { AxiosInstance } from "axios";

export class Meta {
  protected readonly pageAccessToken: string;
  protected readonly api: AxiosInstance;
  protected readonly apiVideo: AxiosInstance;

  constructor({ pageAccessToken, apiVersion }: ConstructorMain) {
    this.pageAccessToken = pageAccessToken;
    this.api = generateAxiosInstance(apiVersion);
    this.apiVideo = generateAxiosInstance(apiVersion, true);
  }
}
