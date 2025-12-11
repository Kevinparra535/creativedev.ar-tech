import { NativeModulesProxy } from 'expo-modules-core';

interface FileInfo {
  name: string;
  path: string;
  size: number;
  createdAt: number;
}

interface ExportResult {
  success: boolean;
  path: string;
  fileName: string;
  message: string;
}

interface ShareResult {
  success: boolean;
  completed: boolean;
  activityType: string;
}

interface DeleteResult {
  success: boolean;
  message: string;
}

const FileExportModule = NativeModulesProxy.ExpoFileExport;

/**
 * File Export Module
 * Provides utilities for exporting and sharing files on iOS
 */
export const FileExport = {
  /**
   * Get the path to the Documents directory (visible in Files app)
   */
  getDocumentsDirectory(): string {
    return FileExportModule.getDocumentsDirectory();
  },

  /**
   * Export a file to the Documents directory
   * Files in this directory are visible in the Files app under "On My iPhone"
   *
   * @param sourcePath - Full path to the source file
   * @param fileName - Name for the exported file (e.g., "my-model.usdz")
   * @returns Promise with export result
   */
  async exportToDocuments(sourcePath: string, fileName: string): Promise<ExportResult> {
    return await FileExportModule.exportToDocuments(sourcePath, fileName);
  },

  /**
   * Share a file using iOS Share Sheet
   * Allows user to save to Files, share via AirDrop, etc.
   *
   * @param filePath - Full path to the file to share
   * @returns Promise with share result
   */
  async shareFile(filePath: string): Promise<ShareResult> {
    return await FileExportModule.shareFile(filePath);
  },

  /**
   * List all files in the Documents directory
   * @returns Array of file information objects
   */
  listDocumentsFiles(): FileInfo[] {
    return FileExportModule.listDocumentsFiles();
  },

  /**
   * Delete a file from the Documents directory
   * @param filePath - Full path to the file to delete
   * @returns Promise with delete result
   */
  async deleteFile(filePath: string): Promise<DeleteResult> {
    return await FileExportModule.deleteFile(filePath);
  },
};
