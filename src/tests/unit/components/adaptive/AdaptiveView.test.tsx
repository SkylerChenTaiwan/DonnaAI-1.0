import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderWithProviders, setPlatform } from '@tests/utils/test-helpers';
import { AdaptiveView } from '@adaptive/core/AdaptiveView';

describe('AdaptiveView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cross-platform consistency', () => {
    it('should render correctly on web platform', () => {
      setPlatform('web');
      
      const { container } = render(
        <AdaptiveView testID="adaptive-view" style={{ padding: 10 }}>
          <div>Test Content</div>
        </AdaptiveView>
      );
      
      expect(container.querySelector('[data-testid="adaptive-view"]')).toBeTruthy();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render correctly on iOS platform', () => {
      setPlatform('ios');
      
      const { container } = render(
        <AdaptiveView testID="adaptive-view" style={{ padding: 10 }}>
          <div>Test Content</div>
        </AdaptiveView>
      );
      
      expect(container.querySelector('[data-testid="adaptive-view"]')).toBeTruthy();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render correctly on Android platform', () => {
      setPlatform('android');
      
      const { container } = render(
        <AdaptiveView testID="adaptive-view" style={{ padding: 10 }}>
          <div>Test Content</div>
        </AdaptiveView>
      );
      
      expect(container.querySelector('[data-testid="adaptive-view"]')).toBeTruthy();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Style adaptation', () => {
    it('should apply platform-specific styles on web', () => {
      setPlatform('web');
      
      const { container } = render(
        <AdaptiveView
          style={{
            padding: 10,
            backgroundColor: 'red'
          }}
          webStyle={{
            backgroundColor: 'blue'
          }}
        >
          Content
        </AdaptiveView>
      );
      
      const element = container.firstChild as HTMLElement;
      expect(element.style.backgroundColor).toBe('blue');
    });

    it('should handle responsive styles', () => {
      setPlatform('web');
      
      const { rerender } = render(
        <AdaptiveView
          responsive={{
            sm: { padding: 10 },
            md: { padding: 20 },
            lg: { padding: 30 }
          }}
        >
          Content
        </AdaptiveView>
      );
      
      // 測試不同螢幕尺寸
      window.innerWidth = 640;
      window.dispatchEvent(new Event('resize'));
      rerender(
        <AdaptiveView
          responsive={{
            sm: { padding: 10 },
            md: { padding: 20 },
            lg: { padding: 30 }
          }}
        >
          Content
        </AdaptiveView>
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on web', () => {
      setPlatform('web');
      
      const { container } = render(
        <AdaptiveView
          accessible={true}
          accessibilityLabel="Test View"
          accessibilityRole="region"
        >
          Content
        </AdaptiveView>
      );
      
      const element = container.firstChild as HTMLElement;
      expect(element.getAttribute('aria-label')).toBe('Test View');
      expect(element.getAttribute('role')).toBe('region');
    });

    it('should handle accessibility props on native platforms', () => {
      setPlatform('ios');
      
      const { container } = render(
        <AdaptiveView
          accessible={true}
          accessibilityLabel="Test View"
          accessibilityHint="This is a test view"
        >
          Content
        </AdaptiveView>
      );
      
      // Native accessibility props should be passed through
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Event handling', () => {
    it('should handle press events consistently', () => {
      const onPress = vi.fn();
      
      ['web', 'ios', 'android'].forEach(platform => {
        setPlatform(platform as any);
        onPress.mockClear();
        
        const { getByTestId } = render(
          <AdaptiveView testID="pressable" onPress={onPress}>
            Press me
          </AdaptiveView>
        );
        
        const element = getByTestId('pressable');
        element.click();
        
        expect(onPress).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle hover events on web', () => {
      setPlatform('web');
      const onHoverIn = vi.fn();
      const onHoverOut = vi.fn();
      
      const { container } = render(
        <AdaptiveView
          onHoverIn={onHoverIn}
          onHoverOut={onHoverOut}
        >
          Hover me
        </AdaptiveView>
      );
      
      const element = container.firstChild as HTMLElement;
      
      // Simulate hover
      const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
      element.dispatchEvent(mouseEnterEvent);
      expect(onHoverIn).toHaveBeenCalled();
      
      const mouseLeaveEvent = new MouseEvent('mouseleave', { bubbles: true });
      element.dispatchEvent(mouseLeaveEvent);
      expect(onHoverOut).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn();
      
      const TestComponent = ({ value }: { value: number }) => {
        renderSpy();
        return <AdaptiveView>Value: {value}</AdaptiveView>;
      };
      
      const { rerender } = render(<TestComponent value={1} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(<TestComponent value={1} />);
      expect(renderSpy).toHaveBeenCalledTimes(1); // Should not re-render
      
      // Re-render with different props
      rerender(<TestComponent value={2} />);
      expect(renderSpy).toHaveBeenCalledTimes(2); // Should re-render
    });
  });

  describe('Error handling', () => {
    it('should handle invalid children gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(
          <AdaptiveView>
            {null}
            {undefined}
            {false}
          </AdaptiveView>
        );
      }).not.toThrow();
      
      consoleError.mockRestore();
    });

    it('should handle missing styles gracefully', () => {
      expect(() => {
        render(
          <AdaptiveView style={undefined}>
            Content
          </AdaptiveView>
        );
      }).not.toThrow();
    });
  });
});