/**
 * 跨平台檔案系統服務
 * 根據平台自動選擇合適的檔案系統實作
 */

import { Platform } from 'react-native';

// 通用的檔案資訊介面
export interface IFileInfo {
  exists: boolean;
  uri?: string;
  size?: number;
  modificationTime?: number;
  isDirectory?: boolean;
}

// 通用的編碼類型
export interface IEncodingType {
  UTF8: string;
  Base64: string;
}

// 通用的檔案系統服務介面
export interface IFileSystemService {
  documentDirectory: string | null;
  cacheDirectory: string | null;
  EncodingType: IEncodingType;
  
  writeAsStringAsync(
    fileUri: string,
    contents: string,
    options?: { encoding?: string }
  ): Promise<void>;
  
  readAsStringAsync(
    fileUri: string,
    options?: { encoding?: string }
  ): Promise<string>;
  
  deleteAsync(
    fileUri: string,
    options?: { idempotent?: boolean }
  ): Promise<void>;
  
  getInfoAsync(
    fileUri: string,
    options?: { size?: boolean }
  ): Promise<IFileInfo>;
  
  makeDirectoryAsync(
    fileUri: string,
    options?: { intermediates?: boolean }
  ): Promise<void>;
  
  // Web 平台特有方法（可選）
  downloadToBrowser?(filename: string, content: string, mimeType?: string): void;
  uploadFromBrowser?(): Promise<{ uri: string; blob: Blob; name: string } | null>;
}

// 動態載入檔案系統服務
let FileSystemService: IFileSystemService;

if (Platform.OS === 'web') {
  // Web 平台使用 WebFileSystem
  FileSystemService = require('./web/WebFileSystem').default;
} else {
  // 原生平台使用 expo-file-system
  FileSystemService = require('expo-file-system');
}

// 匯出統一的檔案系統服務
export const FileSystem = FileSystemService;

// 匯出便利方法
export const saveFile = async (
  filename: string,
  content: string,
  encoding = 'utf8'
): Promise<string> => {
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, content, { encoding });
  return fileUri;
};

export const readFile = async (
  fileUri: string,
  encoding = 'utf8'
): Promise<string> => {
  return FileSystem.readAsStringAsync(fileUri, { encoding });
};

export const deleteFile = async (
  fileUri: string,
  ignoreIfNotExists = true
): Promise<void> => {
  return FileSystem.deleteAsync(fileUri, { idempotent: ignoreIfNotExists });
};

export const fileExists = async (fileUri: string): Promise<boolean> => {
  const info = await FileSystem.getInfoAsync(fileUri);
  return info.exists;
};

// 跨平台檔案下載
export const downloadFile = async (
  filename: string,
  content: string,
  mimeType = 'text/plain'
): Promise<void> => {
  if (Platform.OS === 'web' && FileSystem.downloadToBrowser) {
    // Web 平台：直接下載到瀏覽器
    FileSystem.downloadToBrowser(filename, content, mimeType);
  } else {
    // 原生平台：儲存檔案並分享
    const Sharing = require('expo-sharing');
    const fileUri = await saveFile(filename, content);
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, { mimeType });
    } else {
      throw new Error('裝置不支援檔案分享功能');
    }
  }
};

// 跨平台檔案上傳
export const uploadFile = async (): Promise<{
  uri: string;
  name: string;
  content: string;
} | null> => {
  if (Platform.OS === 'web' && FileSystem.uploadFromBrowser) {
    // Web 平台：從瀏覽器上傳
    const result = await FileSystem.uploadFromBrowser();
    if (result) {
      const content = await readFile(result.uri);
      return {
        uri: result.uri,
        name: result.name,
        content,
      };
    }
    return null;
  } else {
    // 原生平台：使用 DocumentPicker
    const DocumentPicker = require('expo-document-picker');
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    
    if (result.type === 'success') {
      const content = await readFile(result.uri);
      return {
        uri: result.uri,
        name: result.name,
        content,
      };
    }
    return null;
  }
};