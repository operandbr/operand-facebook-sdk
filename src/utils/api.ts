import { ApiVersion } from "@/interfaces/main";
import axios from "axios";

export const generateAxiosInstance = (apiVersion: ApiVersion) => {
  return axios.create({
    baseURL: `https://graph.facebook.com/${apiVersion}`,
  });
};
