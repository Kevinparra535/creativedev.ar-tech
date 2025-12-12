import { useEffect, useState } from 'react';

import { File, Paths } from 'expo-file-system';

export interface USDZFile {
  name: string;
  uri: string;
  size: number;
  modificationTime: number;
}

/**
 * Hook to manage USDZ files in the Documents directory
 * Used to list and select room scan files for loading in AR
 */
export const useFileManager = () => {
  const [usdzFiles, setUsdzFiles] = useState<USDZFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * List all USDZ files in the Documents directory
   */
  const listUsdzFiles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use new expo-file-system v19 API with Paths.document
      const documentsDir = Paths.document;
      console.log('[FileManager] Documents directory:', documentsDir);

      // List all files in the documents directory
      const items = await documentsDir.list();
      console.log('[FileManager] Found items:', items.length);

      // Filter USDZ files
      const usdzFiles = items.filter(
        (item) => item instanceof File && item.name.toLowerCase().endsWith('.usdz')
      ) as File[];
      console.log('[FileManager] USDZ files found:', usdzFiles.length);

      // Get file info for each USDZ file
      const usdzFilesWithInfo = usdzFiles.map((file: File) => {
        // Use the info() method from File class to get file metadata
        const fileInfo = file.info();

        return {
          name: file.name,
          uri: file.uri, // File instances have a .uri property
          size: fileInfo.size || 0,
          modificationTime: fileInfo.modificationTime || 0
        };
      });

      // Sort by modification time (newest first)
      usdzFilesWithInfo.sort(
        (a: USDZFile, b: USDZFile) => b.modificationTime - a.modificationTime
      );

      setUsdzFiles(usdzFilesWithInfo);
      console.log('[FileManager] USDZ files with info:', usdzFilesWithInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to list files';
      console.error('[FileManager] Error listing files:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a USDZ file
   */
  const deleteFile = async (uri: string) => {
    try {
      const file = new File(uri);
      await file.delete();
      console.log('[FileManager] Deleted file:', uri);
      // Refresh the list
      await listUsdzFiles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      console.error('[FileManager] Error deleting file:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Format file size in human-readable format
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Format modification time as readable date
   */
  const formatDate = (timestamp: number): string => {
    if (timestamp === 0) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  // Load files on mount with a small delay to ensure filesystem is ready
  useEffect(() => {
    // Add a small delay to ensure the filesystem is initialized
    const timer = setTimeout(() => {
      listUsdzFiles();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return {
    usdzFiles,
    isLoading,
    error,
    listUsdzFiles,
    deleteFile,
    formatFileSize,
    formatDate
  };
};
