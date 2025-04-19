import axios from "axios";
import { FileStats } from "../types/file";
import { FILE_TYPES, FileTypeConfig } from "../config/fileTypes";
import { API_BASE_URL } from "../config/constants";

const API_URL = API_BASE_URL;

export interface FileInfo {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  file_hash?: string;
  is_duplicate?: boolean;
  original_file_id?: string;
  reference_count?: number;
  storage_saved?: number;
  url?: string;
}

export interface SearchParams {
  search?: string;
  file_type?: string;
  min_size?: number;
  max_size?: number;
  start_date?: string;
  end_date?: string;
}

export interface StorageStats {
  total_files: number;
  total_size: number;
  storage_saved: number;
  duplicate_count: number;
}

export interface FileUploadResponse {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  file_hash: string;
  is_duplicate: boolean;
  original_file_id?: string;
  storage_path: string;
  uploaded_at: string;
  message?: string;
  storage_saved?: number;
}

export const getFileTypeConfig = (
  mimeType: string
): FileTypeConfig | undefined => {
  return Object.values(FILE_TYPES).find((config) =>
    config.acceptedMimeTypes.includes(mimeType)
  );
};

export const validateFile = (
  file: File
): { isValid: boolean; error?: string } => {
  const fileType = getFileTypeConfig(file.type);

  if (!fileType) {
    return {
      isValid: false,
      error: "Unsupported file type",
    };
  }

  if (file.size > fileType.maxSize) {
    return {
      isValid: false,
      error: `File size exceeds the maximum limit of ${
        fileType.maxSize / (1024 * 1024)
      }MB`,
    };
  }

  return { isValid: true };
};

export const uploadFile = async (
  file: File,
  fileType?: string
): Promise<FileUploadResponse> => {
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const fileTypeConfig = fileType
    ? FILE_TYPES[fileType]
    : getFileTypeConfig(file.type);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("file_type", fileTypeConfig?.name.toLowerCase() || "unknown");

  console.log("Uploading file to:", `${API_URL}/files/`);
  console.log("FormData:", {
    file: file.name,
    type: file.type,
    size: file.size,
    fileType: fileTypeConfig?.name.toLowerCase(),
  });

  try {
    const response = await axios.post(`${API_URL}/files/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("Upload response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Upload error:", error);
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.data.is_duplicate) {
        return {
          ...error.response.data,
          id: error.response.data.original_file_id,
          original_filename: file.name,
          file_type: file.type,
          size: file.size,
          is_duplicate: true,
          storage_saved: error.response.data.storage_saved,
        };
      }
      throw new Error(
        error.response.data.message ||
          error.response.data.error ||
          "Failed to upload file"
      );
    }
    throw error;
  }
};

export const getFileTypeIcon = (mimeType: string): string => {
  const fileType = getFileTypeConfig(mimeType);
  return fileType?.icon || "📎"; // Default icon for unknown file types
};

export const fileService = {
  async getFiles(params?: SearchParams): Promise<FileInfo[]> {
    console.log("Fetching files with params:", params);
    const response = await axios.get(`${API_URL}/files/`, { params });
    console.log("Files response:", response.data);
    return response.data;
  },

  async getFile(id: string): Promise<FileInfo> {
    console.log("Fetching file:", id);
    const response = await axios.get(`${API_URL}/files/${id}/`);
    console.log("File response:", response.data);
    return response.data;
  },

  async deleteFile(id: string): Promise<void> {
    console.log("Deleting file:", id);
    await axios.delete(`${API_URL}/files/${id}/`);
  },

  async getStorageStats(): Promise<StorageStats> {
    console.log("Fetching storage stats");
    const response = await axios.get(`${API_URL}/files/stats/`);
    console.log("Stats response:", response.data);
    return response.data;
  },

  async downloadFile(id: string): Promise<void> {
    console.log("Downloading file:", id);
    const response = await axios.get(`${API_URL}/files/${id}/download/`, {
      responseType: "blob",
    });

    // Create a blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `file-${id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async getFileStats(): Promise<FileStats> {
    console.log("Fetching file stats");
    const response = await axios.get<FileStats>(`${API_URL}/files/stats`);
    console.log("File stats response:", response.data);
    return response.data;
  },

  validateFile,
  uploadFile,
};
