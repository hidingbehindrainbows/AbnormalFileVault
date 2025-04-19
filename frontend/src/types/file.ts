export interface File {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  file: string;
}

export interface FileStats {
  total_files: number;
  total_size: number;
  storage_saved: number;
  duplicate_count: number;
}
