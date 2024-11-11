import { ApiVersion } from "@/interfaces/meta-auth";
import axios from "axios";

export const generateAxiosInstance = (
  apiVersion: ApiVersion,
  isVideoApi?: boolean,
) => {
  if (isVideoApi) {
    return axios.create({
      baseURL: `https://graph-video.facebook.com/${apiVersion}`,
    });
  }

  return axios.create({
    baseURL: `https://graph.facebook.com/${apiVersion}`,
  });
};
