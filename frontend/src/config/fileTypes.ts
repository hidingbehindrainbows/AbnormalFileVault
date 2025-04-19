export interface FileTypeConfig {
  name: string;
  description: string;
  acceptedMimeTypes: string[];
  maxSize: number; // in bytes
  icon: string;
}

export const FILE_TYPES: Record<string, FileTypeConfig> = {
  document: {
    name: "Document",
    description: "Text documents, spreadsheets, and presentations",
    acceptedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    icon: "📄",
  },
  image: {
    name: "Image",
    description: "Images in various formats",
    acceptedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
    icon: "🖼️",
  },
  video: {
    name: "Video",
    description: "Video files in common formats",
    acceptedMimeTypes: [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
    icon: "🎥",
  },
  audio: {
    name: "Audio",
    description: "Audio files in various formats",
    acceptedMimeTypes: [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/midi",
      "audio/x-midi",
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    icon: "🎵",
  },
  archive: {
    name: "Archive",
    description: "Compressed file archives",
    acceptedMimeTypes: [
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
      "application/x-tar",
      "application/gzip",
    ],
    maxSize: 200 * 1024 * 1024, // 200MB
    icon: "📦",
  },
  code: {
    name: "Code",
    description: "Source code and configuration files",
    acceptedMimeTypes: [
      "text/plain",
      "text/x-python",
      "text/x-java",
      "text/javascript",
      "text/css",
      "text/html",
      "application/json",
      "application/xml",
    ],
    maxSize: 1 * 1024 * 1024, // 1MB
    icon: "💻",
  },
};
