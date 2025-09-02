import { MetaError } from "../interfaces/meta-response";
import { AxiosError } from "axios";

export class OperandError {
  private message_private: string;
  private code_private: number;

  parseMetaError(...data: any) {
    const { error, message } = data[0];

    console.log({ error });

    if (error instanceof AxiosError) {
      const data = error.response?.data as MetaError;

      if (!data || !data.error) {
        this.message_private = "Unknown error occurred";
        this.code_private = 500;
        return;
      }

      switch (data.error.code) {
        // Authentication Errors
        case 190:
          this.message_private = "Access token has expired";
          this.code_private = data.error.code;
          break;
        case 102:
          this.message_private = "Session has expired";
          this.code_private = data.error.code;
          break;
        case 104:
          this.message_private = "Unsupported version";
          this.code_private = data.error.code;
          break;
        case 2:
          this.message_private = "Service temporarily unavailable";
          this.code_private = data.error.code;
          break;

        // Permission Errors
        case 10:
          this.message_private = "Application does not have permission";
          this.code_private = data.error.code;
          break;
        case 200:
          this.message_private = "Access to this resource not allowed";
          this.code_private = data.error.code;
          break;
        case 210:
          this.message_private = "User not visible";
          this.code_private = data.error.code;
          break;

        // Rate Limit Errors
        case 4:
          this.message_private = "Application request limit reached";
          this.code_private = data.error.code;
          break;
        case 17:
          this.message_private = "User request limit reached";
          this.code_private = data.error.code;
          break;
        case 32:
          this.message_private = "Page request limit reached";
          this.code_private = data.error.code;
          break;

        // Publication Errors - Facebook
        case 100:
          this.message_private = "Invalid parameter";
          this.code_private = data.error.code;
          break;
        case 1487851:
          this.message_private = "Too many URLs in the post message";
          this.code_private = data.error.code;
          break;
        case 368:
          this.message_private =
            "The action attempted has been deemed abusive or is otherwise disallowed";
          this.code_private = data.error.code;
          break;
        case 506:
          this.message_private = "Duplicate post content";
          this.code_private = data.error.code;
          break;
        case 1000:
          this.message_private =
            "Application does not have permission for this action";
          this.code_private = data.error.code;
          break;
        case 1297001:
          this.message_private = "Content type is not supported";
          this.code_private = data.error.code;
          break;
        case 324:
          this.message_private = "Missing or invalid image file";
          this.code_private = data.error.code;
          break;
        case 500:
          this.message_private = "Service error. Try again later.";
          this.code_private = data.error.code;
          break;
        case 1157:
          this.message_private = "Unsupported post request";
          this.code_private = data.error.code;
          break;
        case 36:
          this.message_private = "Upload request limit reached";
          this.code_private = data.error.code;
          break;

        // Publication Errors - Instagram
        case 9007:
          this.message_private = "The image aspect ratio is too narrow";
          this.code_private = data.error.code;
          break;
        case 9008:
          this.message_private = "The image aspect ratio is too wide";
          this.code_private = data.error.code;
          break;
        case 10901:
          this.message_private = "Video too long for Instagram";
          this.code_private = data.error.code;
          break;
        case 352:
          this.message_private = "Instagram account not eligible";
          this.code_private = data.error.code;
          break;
        case 24:
          this.message_private =
            "Error attaching Instagram accounts (permissions or rate limit issue)";
          this.code_private = data.error.code;
          break;
        case 10900:
          this.message_private =
            "Instagram media post not allowing tagged users";
          this.code_private = data.error.code;
          break;
        case 9001:
          this.message_private =
            "Instagram account already has the maximum number of posts in progress";
          this.code_private = data.error.code;
          break;
        case 10902:
          this.message_private = "Instagram media type not supported";
          this.code_private = data.error.code;
          break;
        case 2207:
          this.message_private = "Invalid Instagram media URL or ID";
          this.code_private = data.error.code;
          break;
        case 2500:
          this.message_private = "Too many hashtags in the Instagram post";
          this.code_private = data.error.code;
          break;

        // Content Policy Errors
        case 369:
          this.message_private =
            "Invalid content: does not meet community standards";
          this.code_private = data.error.code;
          break;
        case 370:
          this.message_private =
            "Restricted content: does not meet ad policies";
          this.code_private = data.error.code;
          break;
        case 372:
          this.message_private = "Content contains prohibited terms";
          this.code_private = data.error.code;
          break;

        // Business Errors
        case 33:
          this.message_private = "Business request limit reached";
          this.code_private = data.error.code;
          break;
        case 803:
          this.message_private = "Ad account cannot be used";
          this.code_private = data.error.code;
          break;

        default:
          this.message_private =
            data.error.message || "Error communicating with the target";
          this.code_private = data.error.code || 500;
      }
    } else if (error instanceof OperandError) {
      this.message_private = error.message;
      this.code_private = error.code;
    } else {
      this.message_private = message || "Unknown error occurred";
      this.code_private = 500;
    }
  }

  constructor(...data: any) {
    this.parseMetaError(...data);

    console.error(
      JSON.stringify({
        message: this.message,
        code: this.code,
      }),
    );
  }

  get message() {
    return this.message_private;
  }

  get code() {
    return this.code_private;
  }
}
