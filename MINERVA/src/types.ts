export type UploadItem = {
  id: number;
  file: File;
  progress: number;
  type: "video" | "image";
  url: string;
};