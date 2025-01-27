import { ApiVersion } from "@/interfaces/meta-auth";
import axios from "axios";
import * as http from "node:http";

export const generateAxiosInstance = (
  apiVersion: ApiVersion,
  isVideoApi?: boolean,
) => {
  const timeout = 60000;

  if (isVideoApi) {
    return axios.create({
      baseURL: `https://graph-video.facebook.com/${apiVersion}`,
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
