/**
 * AudioRecorder 組件測試
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioRecorder } from '@/components/audio/AudioRecorder';
import { Audio } from 'expo-av';
import { OfflineRecordingService } from '@/services/offline-recording';
import { PerformanceOptimizer } from '@/utils/performance-optimizer';

// Mock expo-av
vi.mock('expo-av', () => ({
  Audio: {
    usePermissions: vi.fn(() => [
      { status: 'granted' },
      vi.fn()
    ]),
    setAudioModeAsync: vi.fn().mockResolvedValue(undefined),
    Recording: vi.fn().mockImplementation(() => ({
      prepareToRecordAsync: vi.fn().mockResolvedValue(undefined),
      startAsync: vi.fn().mockResolvedValue(undefined),
      pauseAsync: vi.fn().mockResolvedValue(undefined),
      stopAndUnloadAsync: vi.fn().mockResolvedValue({ uri: 'mock-audio-uri' }),
      getStatusAsync: vi.fn().mockResolvedValue({
        isRecording: false,
        isDoneRecording: false,
        durationMillis: 1000
      })
    })),
    InterruptionModeIOS: {
      DoNotMix: 0
    },
    InterruptionModeAndroid: {
      DoNotMix: 0
    }
  }
}));

// Mock 離線錄音服務
vi.mock('@/services/offline-recording', () => ({
  OfflineRecordingService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    isOnline: vi.fn().mockResolvedValue(true),
    getOfflineRecordingsCount: vi.fn().mockResolvedValue(0),
    autoSync: vi.fn().mockResolvedValue(undefined)
  },
  NetworkMonitor: {
    addListener: vi.fn(),
    removeListener: vi.fn()
  }
}));

// Mock 性能優化器
vi.mock('@/utils/performance-optimizer', () => ({
  PerformanceOptimizer: {
    recordAudioStart: vi.fn(),
    recordAudioEnd: vi.fn(),
    getCurrentMetrics: vi.fn().mockReturnValue({
      memoryUsage: 50,
      audioRecordingCount: 0,
      activeRecordings: 0,
      lastOptimization: Date.now()
    })
  }
}));

// Mock common components
vi.mock('@/components/common/Button', () => ({
  Button: ({ title, onPress, testID }: any) => (
    <button testID={testID} onClick={onPress}>
      {title}
    </button>
  )
}));

vi.mock('@/components/common/LoadingSpinner', () => ({
  LoadingSpinner: ({ testID }: any) => (
    <div testID={testID}>Loading...</div>
  )
}));

describe('AudioRecorder', () => {
  const mockOnRecordingComplete = vi.fn();
  const mockOnRecordingStart = vi.fn();
  const mockOnRecordingStop = vi.fn();

  const defaultProps = {
    onRecordingComplete: mockOnRecordingComplete,
    onRecordingStart: mockOnRecordingStart,
    onRecordingStop: mockOnRecordingStop,
    enableOfflineSupport: true,
    userId: 'test-user-123'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本渲染測試', () => {
    it('應該正確渲染錄音組件', () => {
      const { getByTestId } = render(<AudioRecorder {...defaultProps} />);
      
      expect(getByTestId('audio-recorder-container')).toBeDefined();
      expect(getByTestId('recording-duration')).toBeDefined();
      expect(getByTestId('start-recording-button')).toBeDefined();
    });

    it('應該顯示正確的初始狀態', () => {
      const { getByTestId, getByText } = render(<AudioRecorder {...defaultProps} />);
      
      expect(getByText('開始錄音')).toBeDefined();
      expect(getByText('00:00')).toBeDefined();
    });

    it('應該在離線模式下顯示離線指示器', async () => {
      // Mock 離線狀態
      vi.mocked(OfflineRecordingService.isOnline).mockResolvedValue(false);
      vi.mocked(OfflineRecordingService.getOfflineRecordingsCount).mockResolvedValue(3);

      const { getByTestId } = render(<AudioRecorder {...defaultProps} />);
      
      await waitFor(() => {
        expect(getByTestId('offline-indicator')).toBeDefined();
      });
    });
  });

  describe('錄音功能測試', () => {
    it('應該能夠開始錄音', async () => {
      const { getByTestId } = render(<AudioRecorder {...defaultProps} />);
      
      const startButton = getByTestId('start-recording-button');
      fireEvent.press(startButton);
      
      await waitFor(() => {
        expect(mockOnRecordingStart).toHaveBeenCalled();
        expect(PerformanceOptimizer.recordAudioStart).toHaveBeenCalled();
      });
    });

    it('應該能夠暫停錄音', async () => {
      const { getByTestId } = render(<AudioRecorder {...defaultProps} />);
      
      // 先開始錄音
      const startButton = getByTestId('start-recording-button');
      fireEvent.press(startButton);
      
      await waitFor(() => {
        const pauseButton = getByTestId('pause-recording-button');
        fireEvent.press(pauseButton);
      });
      
      // 驗證暫停功能
      await waitFor(() => {
        expect(getByTestId('resume-recording-button')).toBeDefined();
      });
    });

    it('應該能夠停止錄音', async () => {
      const { getByTestId } = render(<AudioRecorder {...defaultProps} />);
      
      // 先開始錄音
      const startButton = getByTestId('start-recording-button');
      fireEvent.press(startButton);
      
      await waitFor(() => {
        const stopButton = getByTestId('stop-recording-button');
        fireEvent.press(stopButton);
      });
      
      await waitFor(() => {
        expect(mockOnRecordingStop).toHaveBeenCalled();
        expect(mockOnRecordingComplete).toHaveBeenCalledWith('mock-audio-uri', 1);
        expect(PerformanceOptimizer.recordAudioEnd).toHaveBeenCalled();
      });
    });

    it('應該正確更新錄音時間', async () => {
      const { getByTestId } = render(<AudioRecorder {...defaultProps} />);
      
      const startButton = getByTestId('start-recording-button');
      fireEvent.press(startButton);
      
      // 等待時間更新
      await waitFor(() => {
        const durationElement = getByTestId('recording-duration');
        expect(durationElement.props.children).not.toBe('00:00');
      }, { timeout: 2000 });
    });
  });

  describe('權限處理測試', () => {
    it('應該在沒有權限時顯示權限請求', async () => {
      // Mock 權限被拒絕
      vi.mocked(Audio.usePermissions).mockReturnValue([
        { status: 'denied' },
        vi.fn()
      ]);

      const { getByText } = render(<AudioRecorder {...defaultProps} />);
      
      await waitFor(() => {
        expect(getByText('請求權限')).toBeDefined();
      });
    });

    it('應該能夠請求音訊權限', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue({ status: 'granted' });
      
      vi.mocked(Audio.usePermissions).mockReturnValue([
        { status: 'undetermined' },
        mockRequestPermission
      ]);

      const { getByTestId } = render(<AudioRecorder {...defaultProps} />);
      
      const requestButton = getByTestId('request-permission-button');
      fireEvent.press(requestButton);
      
      await waitFor(() => {
        expect(mockRequestPermission).toHaveBeenCalled();
      });
    });
  });

  describe('離線功能測試', () => {
    it('應該初始化離線錄音服務', async () => {
      render(<AudioRecorder {...defaultProps} />);
      
      await waitFor(() => {
        expect(OfflineRecordingService.initialize).toHaveBeenCalled();
        expect(OfflineRecordingService.getOfflineRecordingsCount).toHaveBeenCalled();
      });
    });

    it('應該在網路恢復時自動同步', async () => {
      const { rerender } = render(<AudioRecorder {...defaultProps} />);
      
      // 模擬網路狀態變化
      const networkListener = vi.mocked(NetworkMonitor.addListener).mock.calls[0][0];
      
      // 觸發網路恢復
      networkListener(true);
      
      await waitFor(() => {
        expect(OfflineRecordingService.autoSync).toHaveBeenCalledWith('test-user-123');
      });
    });

    it('應該顯示離線錄音數量', async () => {
      vi.mocked(OfflineRecordingService.getOfflineRecordingsCount).mockResolvedValue(5);

      const { getByTestId } = render(<AudioRecorder {...defaultProps} />);
      
      await waitFor(() => {
        const offlineCount = getByTestId('offline-recordings-count');
        expect(offlineCount.props.children).toContain('5');
      });
    });
  });

  describe('波形顯示測試', () => {
    it('應該在啟用時顯示波形', () => {
      const { getByTestId } = render(
        <AudioRecorder {...defaultProps} showWaveform={true} />
      );
      
      expect(getByTestId('waveform-display')).toBeDefined();
    });

    it('應該在禁用時隱藏波形', () => {
      const { queryByTestId } = render(
        <AudioRecorder {...defaultProps} showWaveform={false} />
      );
      
      expect(queryByTestId('waveform-display')).toBeNull();
    });

    it('應該在錄音時更新波形數據', async () => {
      const { getByTestId } = render(
        <AudioRecorder {...defaultProps} showWaveform={true} />
      );
      
      const startButton = getByTestId('start-recording-button');
      fireEvent.press(startButton);
      
      // 等待波形更新
      await waitFor(() => {
        const waveform = getByTestId('waveform-display');
        expect(waveform).toBeDefined();
      });
    });
  });

  describe('錯誤處理測試', () => {
    it('應該優雅地處理錄音初始化錯誤', async () => {
      // Mock 錄音初始化失敗
      vi.mocked(Audio.setAudioModeAsync).mockRejectedValue(new Error('Audio init failed'));

      const { getByTestId } = render(<AudioRecorder {...defaultProps} />);
      
      const startButton = getByTestId('start-recording-button');
      fireEvent.press(startButton);
      
      await waitFor(() => {
        expect(getByTestId('error-message')).toBeDefined();
      });
    });

    it('應該處理權限被拒絕的情況', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue({ status: 'denied' });
      
      vi.mocked(Audio.usePermissions).mockReturnValue([
        { status: 'denied' },
        mockRequestPermission
      ]);

      const { getByText } = render(<AudioRecorder {...defaultProps} />);
      
      await waitFor(() => {
        expect(getByText('音訊權限被拒絕')).toBeDefined();
      });
    });

    it('應該處理錄音過程中的錯誤', async () => {
      // Mock 錄音停止時發生錯誤
      const mockRecording = {
        prepareToRecordAsync: vi.fn().mockResolvedValue(undefined),
        startAsync: vi.fn().mockResolvedValue(undefined),
        stopAndUnloadAsync: vi.fn().mockRejectedValue(new Error('Recording failed')),
        getStatusAsync: vi.fn().mockResolvedValue({
          isRecording: true,
          isDoneRecording: false,
          durationMillis: 1000
        })
      };

      vi.mocked(Audio.Recording).mockImplementation(() => mockRecording);

      const { getByTestId } = render(<AudioRecorder {...defaultProps} />);
      
      // 開始錄音
      const startButton = getByTestId('start-recording-button');
      fireEvent.press(startButton);
      
      await waitFor(() => {
        const stopButton = getByTestId('stop-recording-button');
        fireEvent.press(stopButton);
      });
      
      await waitFor(() => {
        expect(getByTestId('error-message')).toBeDefined();
      });
    });
  });

  describe('性能測試', () => {
    it('應該監控錄音性能指標', async () => {
      const { getByTestId } = render(<AudioRecorder {...defaultProps} />);
      
      const startButton = getByTestId('start-recording-button');
      fireEvent.press(startButton);
      
      await waitFor(() => {
        expect(PerformanceOptimizer.recordAudioStart).toHaveBeenCalled();
      });
      
      const stopButton = getByTestId('stop-recording-button');
      fireEvent.press(stopButton);
      
      await waitFor(() => {
        expect(PerformanceOptimizer.recordAudioEnd).toHaveBeenCalled();
      });
    });

    it('應該在長時間錄音時顯示警告', async () => {
      const { getByTestId } = render(
        <AudioRecorder {...defaultProps} maxDuration={5} />
      );
      
      const startButton = getByTestId('start-recording-button');
      fireEvent.press(startButton);
      
      // 等待超過最大時長
      await waitFor(() => {
        expect(getByTestId('duration-warning')).toBeDefined();
      }, { timeout: 6000 });
    });
  });

  describe('清理測試', () => {
    it('應該在組件卸載時清理資源', () => {
      const { unmount } = render(<AudioRecorder {...defaultProps} />);
      
      unmount();
      
      expect(NetworkMonitor.removeListener).toHaveBeenCalled();
    });

    it('應該停止進行中的錄音', async () => {
      const { getByTestId, unmount } = render(<AudioRecorder {...defaultProps} />);
      
      // 開始錄音
      const startButton = getByTestId('start-recording-button');
      fireEvent.press(startButton);
      
      // 卸載組件
      unmount();
      
      // 驗證錄音被正確停止（通過 performance optimizer 的調用）
      expect(PerformanceOptimizer.recordAudioEnd).toHaveBeenCalled();
    });
  });
});