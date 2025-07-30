/**
 * Web 平台檔案系統服務
 * 使用 File API、IndexedDB 和下載功能實現檔案操作
 */

// 編碼類型
export const EncodingType = {
  UTF8: 'utf8' as const,
  Base64: 'base64' as const,
};

// 檔案資訊介面
export interface FileInfo {
  exists: boolean;
  uri?: string;
  size?: number;
  modificationTime?: number;
  isDirectory?: boolean;
}

// IndexedDB 設定
const DB_NAME = 'DonnaAI-FileSystem';
const DB_VERSION = 1;
const STORE_NAME = 'files';

class WebFileSystemService {
  private db: IDBDatabase | null = null;

  // 初始化 IndexedDB
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'uri' });
        }
      };
    });
  }

  // 獲取文檔目錄（模擬）
  static get documentDirectory(): string {
    return 'web-documents://';
  }

  // 獲取快取目錄（模擬）
  static get cacheDirectory(): string {
    return 'web-cache://';
  }

  // 寫入字串到檔案
  async writeAsStringAsync(
    fileUri: string,
    contents: string,
    options?: { encoding?: string }
  ): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const fileData = {
      uri: fileUri,
      contents,
      encoding: options?.encoding || EncodingType.UTF8,
      modificationTime: Date.now(),
      size: new Blob([contents]).size,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(fileData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 從檔案讀取字串
  async readAsStringAsync(
    fileUri: string,
    options?: { encoding?: string }
  ): Promise<string> {
    const db = await this.initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(fileUri);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result.contents);
        } else {
          reject(new Error(`檔案不存在: ${fileUri}`));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 刪除檔案
  async deleteAsync(
    fileUri: string,
    options?: { idempotent?: boolean }
  ): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(fileUri);
      request.onsuccess = () => resolve();
      request.onerror = () => {
        if (options?.idempotent) {
          resolve(); // 忽略錯誤
        } else {
          reject(request.error);
        }
      };
    });
  }

  // 獲取檔案資訊
  async getInfoAsync(
    fileUri: string,
    options?: { size?: boolean }
  ): Promise<FileInfo> {
    const db = await this.initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(fileUri);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({
            exists: true,
            uri: fileUri,
            size: options?.size ? result.size : undefined,
            modificationTime: result.modificationTime,
            isDirectory: false,
          });
        } else {
          resolve({
            exists: false,
            uri: fileUri,
          });
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 建立目錄（Web 不需要，但保留介面相容性）
  async makeDirectoryAsync(
    fileUri: string,
    options?: { intermediates?: boolean }
  ): Promise<void> {
    // Web 平台不需要建立目錄
    console.log('Web 平台不需要建立目錄:', fileUri);
  }

  // 下載檔案到瀏覽器
  downloadToBrowser(filename: string, content: string, mimeType = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // 清理 URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // 從 Blob 建立檔案 URL
  createFileURL(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  // 撤銷檔案 URL
  revokeFileURL(url: string): void {
    URL.revokeObjectURL(url);
  }

  // 上傳檔案（用於檔案選擇）
  async uploadFromBrowser(): Promise<{ uri: string; blob: Blob; name: string } | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          const uri = `${WebFileSystemService.documentDirectory}${file.name}`;
          
          // 讀取檔案內容
          const arrayBuffer = await file.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: file.type });
          
          // 儲存到 IndexedDB
          const content = await this.blobToString(blob);
          await this.writeAsStringAsync(uri, content);
          
          resolve({ uri, blob, name: file.name });
        } else {
          resolve(null);
        }
      };
      
      input.click();
    });
  }

  // Blob 轉字串
  private async blobToString(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
  }

  // 清理所有檔案（用於測試或重置）
  async clearAll(): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// 建立單例實例
const webFileSystem = new WebFileSystemService();

// 模擬 expo-file-system 的 API
export const FileSystem = {
  documentDirectory: WebFileSystemService.documentDirectory,
  cacheDirectory: WebFileSystemService.cacheDirectory,
  EncodingType,
  
  writeAsStringAsync: (uri: string, contents: string, options?: any) =>
    webFileSystem.writeAsStringAsync(uri, contents, options),
    
  readAsStringAsync: (uri: string, options?: any) =>
    webFileSystem.readAsStringAsync(uri, options),
    
  deleteAsync: (uri: string, options?: any) =>
    webFileSystem.deleteAsync(uri, options),
    
  getInfoAsync: (uri: string, options?: any) =>
    webFileSystem.getInfoAsync(uri, options),
    
  makeDirectoryAsync: (uri: string, options?: any) =>
    webFileSystem.makeDirectoryAsync(uri, options),
    
  // Web 平台特有方法
  downloadToBrowser: (filename: string, content: string, mimeType?: string) =>
    webFileSystem.downloadToBrowser(filename, content, mimeType),
    
  uploadFromBrowser: () => webFileSystem.uploadFromBrowser(),
  
  createFileURL: (blob: Blob) => webFileSystem.createFileURL(blob),
  
  revokeFileURL: (url: string) => webFileSystem.revokeFileURL(url),
  
  clearAll: () => webFileSystem.clearAll(),
};

// 匯出類型
export type { FileInfo };

export default FileSystem;