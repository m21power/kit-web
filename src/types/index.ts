export interface FileSystemItem {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  children?: FileSystemItem[];
  path: string;
}

export interface User {
  username: string;
}

export interface KitCommand {
  command: string;
  args: string[];
  timestamp: Date;
}

export interface KitStatus {
  branch: string;
  deleted: string[];
  staged: string[];
  modified: string[];
  untracked: string[];
}

export interface KitAdd {
  message: string;
  files: string[];
}

export interface KitLogEntry {
  hash: string;
  message: string;
  author: string;
  date: string;
}
export interface RestoreFiles {
  path: string;
  restored: boolean;
}
export interface KitRestore {
  files: RestoreFiles[];
  fileSystem: FileSystemItem;
}
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
