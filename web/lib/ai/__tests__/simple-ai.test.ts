/**
 * PRP-124: 簡單 AI 模組測試
 * 
 * @description 測試 AI 模組的基本功能
 * @version 1.0.0
 * @date 2025-08-19
 */

describe('AI Modules Basic Tests', () => {
  it('should be able to import AI modules', () => {
    // 測試是否能正確匯入模組
    expect(() => {
      const { QueryParser } = require('../query-parser');
      const { IntentRecognitionEngine } = require('../intent-recognition');
      const { EntityExtractionEngine } = require('../entity-extraction');
      const { QueryGenerator } = require('../query-generator');
      const { AIErrorHandler } = require('../error-handler');
      const { AIPerformanceMonitor } = require('../performance-monitor');
      
      expect(QueryParser).toBeDefined();
      expect(IntentRecognitionEngine).toBeDefined();
      expect(EntityExtractionEngine).toBeDefined();
      expect(QueryGenerator).toBeDefined();
      expect(AIErrorHandler).toBeDefined();
      expect(AIPerformanceMonitor).toBeDefined();
    }).not.toThrow();
  });

  it('should create AI module instances', () => {
    const { QueryParser } = require('../query-parser');
    const { IntentRecognitionEngine } = require('../intent-recognition');
    const { EntityExtractionEngine } = require('../entity-extraction');
    const { QueryGenerator } = require('../query-generator');
    const { AIErrorHandler } = require('../error-handler');
    const { AIPerformanceMonitor } = require('../performance-monitor');

    expect(() => {
      new QueryParser();
      new IntentRecognitionEngine();
      new EntityExtractionEngine();
      new QueryGenerator();
      new AIErrorHandler();
      new AIPerformanceMonitor();
    }).not.toThrow();
  });

  it('should have expected methods', () => {
    const { QueryParser } = require('../query-parser');
    const { IntentRecognitionEngine } = require('../intent-recognition');
    const { EntityExtractionEngine } = require('../entity-extraction');

    const queryParser = new QueryParser();
    const intentEngine = new IntentRecognitionEngine();
    const entityEngine = new EntityExtractionEngine();

    expect(typeof queryParser.parseQuery).toBe('function');
    expect(typeof queryParser.validateQuery).toBe('function');
    
    expect(typeof intentEngine.recognizeIntent).toBe('function');
    expect(typeof intentEngine.classifyQuery).toBe('function');
    
    expect(typeof entityEngine.extractEntities).toBe('function');
    expect(typeof entityEngine.validateEntities).toBe('function');
  });
});