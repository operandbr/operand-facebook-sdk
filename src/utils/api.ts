import { ApiVersion } from "@/interfaces/meta-auth";
import axios from "axios";

export const generateAxiosInstance = (
  apiVersion: ApiVersion,
  isVideoApi?: boolean,
) => {
  const timeout = 60000;

  if (isVideoApi) {
    return axios.create({
      baseURL: `https://graph-video.facebook.com/${apiVersion}`,
      timeout,
    });
  }

  return axios.create({
    baseURL: `https://graph.facebook.com/${apiVersion}`,
    timeout,
  });
};
