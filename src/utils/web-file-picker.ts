/**
 * Web 專用檔案選擇器
 * 提供跨平台的檔案選擇功能
 */

import { Platform } from 'react-native';

interface FilePickerAsset {
  uri: string;
  name: string;
  size: number;
  mimeType?: string;
}

interface FilePickerResult {
  canceled: boolean;
  assets?: FilePickerAsset[];
}

interface FilePickerOptions {
  type?: string | string[];
  copyToCacheDirectory?: boolean;
  multiple?: boolean;
}

/**
 * 跨平台的檔案選擇器
 * Web 端使用原生 HTML input
 * Native 端使用 expo-document-picker
 */
export const pickDocument = async (options: FilePickerOptions): Promise<FilePickerResult> => {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      // 創建隱藏的 input 元素
      const input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      
      // 設置接受的檔案類型
      if (options.type) {
        const types = Array.isArray(options.type) ? options.type : [options.type];
        // 轉換 MIME 類型到 accept 屬性格式
        const accept = types.map(t => {
          if (t.includes('csv')) return '.csv,text/csv,application/csv';
          return t;
        }).join(',');
        input.accept = accept;
      }
      
      // 設置是否允許多選
      if (options.multiple) {
        input.multiple = true;
      }
      
      // 處理檔案選擇
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const files = target.files;
        
        if (!files || files.length === 0) {
          resolve({ canceled: true });
          return;
        }
        
        // 轉換 FileList 到 assets 格式
        const assets: FilePickerAsset[] = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // 使用 FileReader 讀取檔案內容
          const uri = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve(e.target?.result as string);
            };
            reader.readAsDataURL(file);
          });
          
          assets.push({
            uri,
            name: file.name,
            size: file.size,
            mimeType: file.type || undefined });
        }
        
        resolve({
          canceled: false,
          assets });
        
        // 清理
        document.body.removeChild(input);
      };
      
      // 處理取消
      input.oncancel = () => {
        resolve({ canceled: true });
        document.body.removeChild(input);
      };
      
      // 添加到 DOM 並觸發點擊
      document.body.appendChild(input);
      input.click();
    });
  } else {
    // Native 平台使用 expo-document-picker
    const DocumentPicker = await import('expo-document-picker');
    const result = await DocumentPicker.getDocumentAsync(options as any);
    
    // 確保返回的結果符合 FilePickerResult 類型
    if (!result.canceled && result.assets) {
      return {
        canceled: false,
        assets: result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          mimeType: asset.mimeType })) };
    }
    
    return { canceled: true };
  }
};