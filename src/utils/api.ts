import { ApiVersion } from "@/interfaces/meta-auth";
import axios from "axios";
import * as http from "node:http";

export interface IGenerateAxiosInstance {
  apiVersion: ApiVersion;
  isVideoApi?: boolean;
  isInstagramApi?: boolean;
  isInstagramAccessToken?: boolean;
}

export const generateAxiosInstance = ({
  apiVersion,
  isInstagramAccessToken,
  isInstagramApi,
  isVideoApi,
}: IGenerateAxiosInstance) => {
  const timeout = 60000;

  if (isVideoApi) {
    return axios.create({
      baseURL: `https://graph-video.facebook.com/${apiVersion}`,
      timeout,
      httpAgent: new http.Agent({ keepAlive: true }),
    });
  } else if (isInstagramAccessToken) {
    return axios.create({
      baseURL: `https://api.instagram.com`,
      timeout,
      httpAgent: new http.Agent({ keepAlive: true }),
    });
  } else if (isInstagramApi) {
    return axios.create({
      baseURL: `https://graph.instagram.com/${apiVersion}`,
      timeout,
      httpAgent: new http.Agent({ keepAlive: true }),
    });
  }

  return axios.create({
    baseURL: `https://graph.facebook.com/${apiVersion}`,
    timeout,
    httpAgent: new http.Agent({ keepAlive: true }),
  });
};
