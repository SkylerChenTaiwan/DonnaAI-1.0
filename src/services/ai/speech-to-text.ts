/**
 * 語音轉文字服務
 * 整合 Cloud Functions 進行語音識別處理
 */

import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage, getFirebaseFunctions } from '@/services/firebase/config';

export interface SpeechToTextOptions {
  language?: string;
  encoding?: 'WEBM_OPUS' | 'MP3' | 'WAV' | 'FLAC';
  sampleRateHertz?: number;
  maxAlternatives?: number;
  profanityFilter?: boolean;
  enableAutomaticPunctuation?: boolean;
}

export interface TranscriptionResult {
  transcription: string;
  confidence: number;
  alternatives?: TranscriptionAlternative[];
  duration: number;
  languageCode: string;
  error?: string;
}

export interface TranscriptionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechProcessingProgress {
  stage: 'uploading' | 'processing' | 'completing';
  percentage: number;
  message: string;
}

/**
 * 將音頻檔案轉換為文字
 */
export async function transcribeAudio(
  audioUri: string,
  options: SpeechToTextOptions = {},
  onProgress?: (progress: SpeechProcessingProgress) => void
): Promise<TranscriptionResult> {
  const {
    language = 'zh-TW', // 預設繁體中文
    encoding = 'WEBM_OPUS',
    sampleRateHertz = 48000,
    maxAlternatives = 3,
    profanityFilter = false,
    enableAutomaticPunctuation = true,
  } = options;

  try {
    // 第一階段：上傳音頻檔案
    onProgress?.({
      stage: 'uploading',
      percentage: 10,
      message: '正在上傳音頻檔案...',
    });

    const audioUrl = await uploadAudioFile(audioUri, (uploadProgress) => {
      onProgress?.({
        stage: 'uploading',
        percentage: 10 + uploadProgress * 0.3, // 10%-40%
        message: `上傳中... ${Math.round(uploadProgress)}%`,
      });
    });

    // 第二階段：呼叫 Cloud Function 進行處理
    onProgress?.({
      stage: 'processing',
      percentage: 40,
      message: '正在進行語音識別...',
    });

    const transcribeFunction = httpsCallable(getFirebaseFunctions(), 'transcribeAudio');
    
    const response = await transcribeFunction({
      audioUrl,
      options: {
        languageCode: language,
        encoding,
        sampleRateHertz,
        maxAlternatives,
        profanityFilter,
        enableAutomaticPunctuation,
      },
    });

    const result = response.data as any;

    // 第三階段：完成
    onProgress?.({
      stage: 'completing',
      percentage: 100,
      message: '轉錄完成',
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      transcription: result.transcription || '',
      confidence: result.confidence || 0,
      alternatives: result.alternatives || [],
      duration: result.duration || 0,
      languageCode: result.languageCode || language,
    };

  } catch (error) {
    console.error('語音轉文字失敗:', error);
    throw new Error(
      error instanceof Error ? error.message : '語音轉文字處理失敗'
    );
  }
}

/**
 * 上傳音頻檔案到 Firebase Storage
 */
async function uploadAudioFile(
  audioUri: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // 從 URI 讀取檔案
    const response = await fetch(audioUri);
    const blob = await response.blob();

    // 生成唯一檔案名稱
    const fileName = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
    const storageRef = ref(getFirebaseStorage(), `audio/transcripts/${fileName}`);

    // 上傳檔案（注意：實際的進度回調需要更複雜的實現）
    onProgress?.(0);
    
    // 模擬上傳進度
    const uploadTask = uploadBytes(storageRef, blob);
    
    // 簡單的進度模擬
    const progressInterval = setInterval(() => {
      // 這裡應該使用實際的上傳進度，但 uploadBytes 不直接提供進度回調
      // 在實際應用中，可能需要使用 uploadBytesResumable
    }, 500);

    const snapshot = await uploadTask;
    clearInterval(progressInterval);
    
    onProgress?.(100);

    // 獲取下載 URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;

  } catch (error) {
    console.error('音頻檔案上傳失敗:', error);
    throw new Error('音頻檔案上傳失敗');
  }
}

/**
 * 檢查音頻檔案是否適合轉錄
 */
export function validateAudioFile(
  audioUri: string,
  maxSizeMB: number = 10,
  maxDurationSeconds: number = 3600
): Promise<{
  isValid: boolean;
  reason?: string;
  size?: number;
  duration?: number;
}> {
  return new Promise(async (resolve) => {
    try {
      const response = await fetch(audioUri);
      const blob = await response.blob();
      const sizeMB = blob.size / (1024 * 1024);

      if (sizeMB > maxSizeMB) {
        resolve({
          isValid: false,
          reason: `檔案大小超過限制 (${sizeMB.toFixed(1)}MB > ${maxSizeMB}MB)`,
          size: blob.size,
        });
        return;
      }

      // 如果可以獲取音頻時長，在這裡檢查
      // 這需要更複雜的音頻分析，暫時跳過

      resolve({
        isValid: true,
        size: blob.size,
      });

    } catch (error) {
      resolve({
        isValid: false,
        reason: '無法讀取音頻檔案',
      });
    }
  });
}

/**
 * 估算轉錄時間
 */
export function estimateTranscriptionTime(
  durationSeconds: number,
  complexity: 'simple' | 'medium' | 'complex' = 'medium'
): number {
  const baseMultiplier = {
    simple: 0.2,   // 20% 的音頻時長
    medium: 0.3,   // 30% 的音頻時長
    complex: 0.5,  // 50% 的音頻時長
  };

  return Math.max(5, Math.ceil(durationSeconds * baseMultiplier[complexity]));
}

/**
 * 批量轉錄音頻檔案
 */
export async function batchTranscribeAudio(
  audioFiles: Array<{
    uri: string;
    id: string;
    name?: string;
  }>,
  options: SpeechToTextOptions = {},
  onProgress?: (progress: {
    total: number;
    completed: number;
    current: string;
    percentage: number;
  }) => void
): Promise<Array<{
  id: string;
  result?: TranscriptionResult;
  error?: string;
}>> {
  const results: Array<{
    id: string;
    result?: TranscriptionResult;
    error?: string;
  }> = [];

  for (let i = 0; i < audioFiles.length; i++) {
    const file = audioFiles[i];
    
    onProgress?.({
      total: audioFiles.length,
      completed: i,
      current: file.name || file.id,
      percentage: (i / audioFiles.length) * 100,
    });

    try {
      const result = await transcribeAudio(file.uri, options);
      results.push({
        id: file.id,
        result,
      });
    } catch (error) {
      results.push({
        id: file.id,
        error: error instanceof Error ? error.message : '轉錄失敗',
      });
    }

    // 短暫延遲避免過度負載
    if (i < audioFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  onProgress?.({
    total: audioFiles.length,
    completed: audioFiles.length,
    current: '完成',
    percentage: 100,
  });

  return results;
}

/**
 * 清理轉錄文本
 */
export function cleanTranscriptionText(text: string): string {
  return text
    .trim()
    // 移除多餘的空格
    .replace(/\s+/g, ' ')
    // 修正常見的中文標點符號問題
    .replace(/\s*([，。！？：；])\s*/g, '$1')
    // 移除開頭和結尾的標點符號
    .replace(/^[，。！？：；\s]+|[，。！？：；\s]+$/g, '')
    // 確保句子結尾有標點符號
    .replace(/([^。！？])$/, '$1。');
}

/**
 * 分析轉錄品質
 */
export function analyzeTranscriptionQuality(result: TranscriptionResult): {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  let score = result.confidence;
  let quality: 'excellent' | 'good' | 'fair' | 'poor';

  // 檢查置信度
  if (result.confidence < 0.5) {
    issues.push('語音識別置信度較低');
    suggestions.push('建議重新錄製，確保環境安靜、發音清晰');
  } else if (result.confidence < 0.7) {
    issues.push('部分內容可能不準確');
    suggestions.push('建議檢查並修正轉錄結果');
  }

  // 檢查文本長度
  if (result.transcription.length < 10) {
    issues.push('轉錄內容過短');
    suggestions.push('確認錄音時間是否足夠');
  }

  // 檢查是否有備選項
  if (result.alternatives && result.alternatives.length > 1) {
    const confidenceDiff = result.confidence - (result.alternatives[1]?.confidence || 0);
    if (confidenceDiff < 0.2) {
      issues.push('存在多個可能的轉錄結果');
      suggestions.push('建議人工檢查並選擇最合適的版本');
    }
  }

  // 計算品質等級
  if (score >= 0.9) {
    quality = 'excellent';
  } else if (score >= 0.75) {
    quality = 'good';
  } else if (score >= 0.6) {
    quality = 'fair';
  } else {
    quality = 'poor';
  }

  return {
    quality,
    score,
    issues,
    suggestions,
  };
}