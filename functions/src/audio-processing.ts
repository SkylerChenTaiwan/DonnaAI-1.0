/**
 * 音訊處理 Cloud Function
 * 處理上傳的音訊檔案，轉換為文字並進行 AI 分析
 */

import { onObjectFinalized } from "firebase-functions/v2/storage";
import * as admin from "firebase-admin";
import { SpeechClient } from "@google-cloud/speech";
import { Storage } from "@google-cloud/storage";
import { analyzeTranscription } from "./ai-analysis";
import { extractFieldsFromTranscription } from "./field-extraction-internal";

// 初始化服務
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = new Storage();
const speechClient = new SpeechClient();

/**
 * 音訊檔案處理觸發器
 * 當音訊檔案上傳到 Storage 時自動觸發
 */
export const processAudioFile = onObjectFinalized(
  {
    region: "asia-east1",
    memory: "2GiB",
    timeoutSeconds: 540,
    secrets: ["OPENAI_API_KEY", "CLAUDE_API_KEY", "GEMINI_API_KEY"]
  },
  async (event) => {
    const object = event.data;
    try {
      const filePath = object.name;
      const contentType = object.contentType;

      // 檢查是否為音訊檔案
      if (!filePath || !contentType || !contentType.startsWith("audio/")) {
        console.log("不是音訊檔案，跳過處理");
        return;
      }

      // 檢查是否在正確的路徑下（records/audio/）
      if (!filePath.startsWith("records/audio/")) {
        console.log("音訊檔案不在指定路徑，跳過處理");
        return;
      }

      // 從檔案路徑中提取紀錄 ID
      const pathParts = filePath.split("/");
      const recordId = pathParts[2]?.split(".")[0];

      if (!recordId) {
        throw new Error("無法從檔案路徑提取紀錄 ID");
      }

      console.log(`開始處理音訊檔案: ${filePath}, 紀錄 ID: ${recordId}`);

      // 獲取紀錄文件
      const recordRef = db.collection("records").doc(recordId);
      const recordDoc = await recordRef.get();

      if (!recordDoc.exists) {
        throw new Error(`找不到紀錄: ${recordId}`);
      }

      const record = recordDoc.data();
      if (!record) {
        throw new Error("紀錄資料為空");
      }

      // 更新狀態為處理中
      await recordRef.update({
        status: "processing",
        audioProcessingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 下載音訊檔案到記憶體
      const bucket = storage.bucket(object.bucket);
      const file = bucket.file(filePath);
      const [audioBuffer] = await file.download();

      // 準備語音轉文字請求
      const audioBytes = audioBuffer.toString("base64");
      const request = {
        audio: {
          content: audioBytes,
        },
        config: {
          encoding: getAudioEncoding(contentType),
          sampleRateHertz: 16000, // 預設值，可能需要根據實際音訊調整
          languageCode: "zh-TW", // 繁體中文
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
          model: "latest_long", // 使用長音訊模型
          useEnhanced: true, // 使用增強模型（如果可用）
        },
      };

      // 執行語音轉文字
      console.log("開始語音轉文字...");
      const [response] = await speechClient.recognize(request);
      const transcription = response.results
        ?.map((result) => result.alternatives?.[0]?.transcript)
        .join("\n") || "";

      if (!transcription) {
        throw new Error("轉錄結果為空");
      }

      console.log(`轉錄完成，文字長度: ${transcription.length}`);

      // 使用 AI 分析轉錄文字
      console.log("開始 AI 分析...");
      const aiAnalysis = await analyzeTranscription(transcription, {
        type: record.type || "meeting",
        customerName: record.customerName,
        participantNames: record.participantNames,
      });

      // 計算音訊時長（分鐘）
      const duration = Math.ceil(
        Number(response.results?.[0]?.resultEndTime?.seconds || 0) / 60
      );

      // 從轉錄文字中提取自訂欄位
      let aiFieldMappings = null;
      if (record.organizationId) {
        console.log("開始提取自訂欄位...");
        try {
          aiFieldMappings = await extractFieldsFromTranscription(
            recordId,
            transcription,
            aiAnalysis.summary,
            record.organizationId
          );
        } catch (error) {
          console.error("提取自訂欄位失敗:", error);
          // 不中斷整個流程
        }
      }

      // 更新紀錄文件
      const updateData: any = {
        transcription,
        aiSummary: aiAnalysis.summary,
        aiActionItems: aiAnalysis.actionItems,
        aiKeyTopics: aiAnalysis.keyTopics,
        aiSentiment: aiAnalysis.sentiment,
        duration,
        status: "completed",
        audioProcessingCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        aiProcessingMetadata: {
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          modelUsed: "openai-gpt-4", // 或其他使用的模型
          totalConfidence: aiFieldMappings?.averageConfidence || 0,
        },
      };

      if (aiFieldMappings && aiFieldMappings.mappings.length > 0) {
        updateData.aiFieldMappings = aiFieldMappings.mappings;
        updateData.aiConfirmationStatus = "pending";

        // 建立確認請求
        const confirmationRef = db.collection("aiConfirmations").doc();
        await confirmationRef.set({
          id: confirmationRef.id,
          recordId,
          customerId: record.customerIds?.[0],
          fieldMappings: aiFieldMappings.mappings,
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          organizationId: record.organizationId,
        });

        updateData.aiConfirmationId = confirmationRef.id;
      }

      await recordRef.update(updateData);

      console.log(`音訊處理完成: ${recordId}`);

      // 如果有客戶關聯，更新最後聯絡日期
      if (record.customerIds && record.customerIds.length > 0) {
        const batch = db.batch();
        for (const customerId of record.customerIds) {
          const customerRef = db.collection("customers").doc(customerId);
          batch.update(customerRef, {
            lastContactDate: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        await batch.commit();
      }

      // 從任務中提取並建立任務文件
      if (aiAnalysis.actionItems && aiAnalysis.actionItems.length > 0) {
        await createTasksFromActionItems(
          recordId,
          aiAnalysis.actionItems,
          record
        );
      }

    } catch (error) {
      console.error("音訊處理失敗:", error);

      // 嘗試更新錯誤狀態
      if (object.name) {
        const recordId = object.name.split("/")[2]?.split(".")[0];
        if (recordId) {
          await db.collection("records").doc(recordId).update({
            status: "error",
            audioProcessingError: error instanceof Error ? error.message : "未知錯誤",
            audioProcessingFailedAt: admin.firestore.FieldValue.serverTimestamp(),
          }).catch(console.error);
        }
      }

      throw error;
    }
  });

/**
 * 根據內容類型獲取音訊編碼格式
 */
function getAudioEncoding(contentType: string): any {
  const encodingMap: Record<string, any> = {
    "audio/wav": "LINEAR16",
    "audio/mp3": "MP3",
    "audio/mpeg": "MP3",
    "audio/ogg": "OGG_OPUS",
    "audio/webm": "WEBM_OPUS",
    "audio/flac": "FLAC",
  };

  return encodingMap[contentType] || "ENCODING_UNSPECIFIED";
}

/**
 * 從 AI 提取的行動項目建立任務
 */
async function createTasksFromActionItems(
  recordId: string,
  actionItems: string[],
  record: any
): Promise<void> {
  const batch = db.batch();

  for (const actionItem of actionItems) {
    const taskRef = db.collection("tasks").doc();
    const taskData = {
      id: taskRef.id,
      title: actionItem,
      type: "unscheduled" as const,
      priority: "medium" as const,
      status: "todo" as const,
      assigneeId: record.createdBy,
      customerIds: record.customerIds || [],
      recordId,
      source: "ai_extracted" as const,
      teamId: record.teamId,
      organizationId: record.organizationId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    batch.set(taskRef, taskData);
  }

  await batch.commit();
  console.log(`建立了 ${actionItems.length} 個任務`);
}