import { getCLS, getFCP, getFID, getLCP, getTTFB, Metric } from 'web-vitals';

interface MetricEntry {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
  sessionId: string;
  userId?: string;
}

interface ErrorMetric {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  sessionId: string;
  userId?: string;
}

export class ClientMetricsCollector {
  private metrics: Map<string, MetricEntry> = new Map();
  private errors: ErrorMetric[] = [];
  private sessionId: string;
  private userId?: string;
  private batchTimer?: NodeJS.Timeout;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_INTERVAL = 5000; // 5 seconds

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeMetricsCollection();
    this.initializeErrorTracking();
    this.initializeUserTracking();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMetricsCollection(): void {
    // Core Web Vitals
    getCLS(this.handleMetric.bind(this));
    getFCP(this.handleMetric.bind(this));
    getFID(this.handleMetric.bind(this));
    getLCP(this.handleMetric.bind(this));
    getTTFB(this.handleMetric.bind(this));

    // Custom metrics
    this.trackCustomMetrics();
    
    // Navigation timing
    this.trackNavigationTiming();
    
    // Resource timing
    this.trackResourceTiming();
  }

  private handleMetric(metric: Metric): void {
    const entry: MetricEntry = {
      name: metric.name,
      value: metric.value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.metrics.set(metric.name, entry);
    
    // Batch sending
    if (this.metrics.size >= this.BATCH_SIZE) {
      this.flushMetrics();
    } else {
      this.scheduleBatch();
    }
  }

  private trackCustomMetrics(): void {
    // Time to Interactive
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.handleMetric({
              name: entry.name,
              value: entry.duration,
              delta: entry.duration,
              id: `${entry.name}-${Date.now()}`,
              entries: [entry],
              navigationType: 'navigate',
              rating: 'good'
            } as Metric);
          }
        }
      });
      
      observer.observe({ entryTypes: ['measure'] });
    }

    // Memory usage (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.handleMetric({
          name: 'memory-usage',
          value: memory.usedJSHeapSize / 1048576, // Convert to MB
          delta: 0,
          id: `memory-${Date.now()}`,
          entries: [],
          navigationType: 'navigate',
          rating: 'good'
        } as Metric);
      }, 10000);
    }
  }

  private trackNavigationTiming(): void {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        // DOM Content Loaded
        this.handleMetric({
          name: 'dom-content-loaded',
          value: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          delta: 0,
          id: 'dom-content-loaded',
          entries: [],
          navigationType: 'navigate',
          rating: 'good'
        } as Metric);

        // Page Load Complete
        this.handleMetric({
          name: 'page-load-complete',
          value: navigation.loadEventEnd - navigation.fetchStart,
          delta: 0,
          id: 'page-load-complete',
          entries: [],
          navigationType: 'navigate',
          rating: 'good'
        } as Metric);
      }
    });
  }

  private trackResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;
            
            // Track slow resources
            if (resource.duration > 1000) {
              this.handleMetric({
                name: 'slow-resource',
                value: resource.duration,
                delta: 0,
                id: `resource-${Date.now()}`,
                entries: [resource],
                navigationType: 'navigate',
                rating: resource.duration > 3000 ? 'poor' : 'needs-improvement'
              } as Metric);
            }
          }
        }
      });
      
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  private initializeErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: event.filename || window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        userId: this.userId
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        userId: this.userId
      });
    });

    // Console errors
    const originalError = console.error;
    console.error = (...args) => {
      this.trackError({
        message: args.join(' '),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        userId: this.userId
      });
      originalError.apply(console, args);
    };
  }

  private trackError(error: ErrorMetric): void {
    this.errors.push(error);
    
    // Send errors immediately
    if (this.errors.length >= 5 || this.isCriticalError(error)) {
      this.flushErrors();
    }
  }

  private isCriticalError(error: ErrorMetric): boolean {
    const criticalKeywords = ['CRITICAL', 'FATAL', 'SecurityError', 'NetworkError'];
    return criticalKeywords.some(keyword => error.message.includes(keyword));
  }

  private initializeUserTracking(): void {
    // Track user interactions
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const trackableElement = target.closest('[data-track]');
      
      if (trackableElement) {
        this.trackEvent('click', {
          element: trackableElement.getAttribute('data-track') || 'unknown',
          timestamp: Date.now()
        });
      }
    });

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('visibility-change', {
        hidden: document.hidden,
        timestamp: Date.now()
      });
    });

    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercentage > maxScroll) {
        maxScroll = scrollPercentage;
        if (maxScroll % 25 === 0) { // Track at 25%, 50%, 75%, 100%
          this.trackEvent('scroll-depth', {
            depth: maxScroll,
            timestamp: Date.now()
          });
        }
      }
    });
  }

  private trackEvent(eventName: string, data: any): void {
    this.handleMetric({
      name: `event-${eventName}`,
      value: 1,
      delta: 0,
      id: `event-${Date.now()}`,
      entries: [],
      navigationType: 'navigate',
      rating: 'good'
    } as Metric);
  }

  private scheduleBatch(): void {
    if (this.batchTimer) return;
    
    this.batchTimer = setTimeout(() => {
      this.flushMetrics();
      this.batchTimer = undefined;
    }, this.BATCH_INTERVAL);
  }

  private async flushMetrics(): Promise<void> {
    if (this.metrics.size === 0) return;
    
    const metricsArray = Array.from(this.metrics.values());
    this.metrics.clear();
    
    try {
      await this.sendMetrics(metricsArray);
    } catch (error) {
      console.error('Failed to send metrics:', error);
      // Re-add metrics for retry
      metricsArray.forEach(metric => {
        this.metrics.set(metric.name, metric);
      });
    }
  }

  private async flushErrors(): Promise<void> {
    if (this.errors.length === 0) return;
    
    const errorsToSend = [...this.errors];
    this.errors = [];
    
    try {
      await this.sendErrors(errorsToSend);
    } catch (error) {
      console.error('Failed to send errors:', error);
      // Re-add errors for retry
      this.errors.push(...errorsToSend);
    }
  }

  private async sendMetrics(metrics: MetricEntry[]): Promise<void> {
    const response = await fetch('/api/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metrics,
        sessionId: this.sessionId,
        timestamp: Date.now()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send metrics: ${response.statusText}`);
    }
  }

  private async sendErrors(errors: ErrorMetric[]): Promise<void> {
    const response = await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        errors,
        sessionId: this.sessionId,
        timestamp: Date.now()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send errors: ${response.statusText}`);
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public flush(): void {
    this.flushMetrics();
    this.flushErrors();
  }

  public destroy(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    this.flush();
  }
}

// Singleton instance
let collector: ClientMetricsCollector | null = null;

export function initializeMetrics(): ClientMetricsCollector {
  if (!collector) {
    collector = new ClientMetricsCollector();
  }
  return collector;
}

export function getMetricsCollector(): ClientMetricsCollector | null {
  return collector;
}