/**
 * Modal Component - 基於 Radix UI Dialog 的模態對話框元件
 * 支援多種尺寸、位置和自訂化選項，符合 DonnaAI 設計系統
 */

"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Cross2Icon } from "@radix-ui/react-icons";

// Modal 內容變體樣式
const modalContentVariants = cva(
  // 基礎樣式
  "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border-light bg-background-surface p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg",
  {
    variants: {
      // 尺寸變體
      size: {
        xs: "max-w-xs",
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        "5xl": "max-w-5xl",
        full: "max-w-full m-2"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);

// Modal 元件 Props
export interface ModalProps extends VariantProps<typeof modalContentVariants> {
  /**
   * 是否顯示 Modal
   */
  open?: boolean;
  /**
   * Modal 顯示狀態改變回調
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Modal 內容
   */
  children: React.ReactNode;
  /**
   * 是否顯示關閉按鈕
   */
  showCloseButton?: boolean;
  /**
   * 是否可以透過點擊遮罩關閉
   */
  closeOnOverlayClick?: boolean;
  /**
   * 是否可以透過 ESC 鍵關閉
   */
  closeOnEscape?: boolean;
  /**
   * 自訂 className
   */
  className?: string;
  /**
   * Modal 標題（用於無障礙）
   */
  title?: string;
  /**
   * Modal 描述（用於無障礙）
   */
  description?: string;
}

// ModalHeader 元件 Props
export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

// ModalTitle 元件 Props
export interface ModalTitleProps 
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {}

// ModalDescription 元件 Props
export interface ModalDescriptionProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> {}

// ModalContent 元件 Props
export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {}

// ModalFooter 元件 Props
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Modal 主元件
 */
const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  children,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  size,
  className,
  title,
  description
}) => {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* 遮罩層 */}
        <DialogPrimitive.Overlay 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        
        {/* Modal 內容 */}
        <DialogPrimitive.Content
          className={cn(modalContentVariants({ size }), className)}
          onPointerDownOutside={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
          onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
        >
          {/* 標題（無障礙） */}
          {title && (
            <DialogPrimitive.Title className="sr-only">
              {title}
            </DialogPrimitive.Title>
          )}
          
          {/* 描述（無障礙） */}
          {description && (
            <DialogPrimitive.Description className="sr-only">
              {description}
            </DialogPrimitive.Description>
          )}
          
          {children}
          
          {/* 關閉按鈕 */}
          {showCloseButton && (
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none">
              <Cross2Icon className="h-4 w-4" />
              <span className="sr-only">關閉</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

/**
 * ModalTrigger 元件 - 觸發 Modal 的按鈕
 */
const ModalTrigger = DialogPrimitive.Trigger;

/**
 * ModalHeader 元件
 */
const ModalHeader: React.FC<ModalHeaderProps> = ({ 
  className, 
  children, 
  ...props 
}) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  >
    {children}
  </div>
);

/**
 * ModalTitle 元件
 */
const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  ModalTitleProps
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-text-primary", className)}
    {...props}
  >
    {children}
  </DialogPrimitive.Title>
));

/**
 * ModalDescription 元件
 */
const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  ModalDescriptionProps
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  >
    {children}
  </DialogPrimitive.Description>
));

/**
 * ModalContent 元件
 */
const ModalContent: React.FC<ModalContentProps> = ({ 
  className, 
  children, 
  ...props 
}) => (
  <div className={cn("grid gap-4", className)} {...props}>
    {children}
  </div>
);

/**
 * ModalFooter 元件
 */
const ModalFooter: React.FC<ModalFooterProps> = ({ 
  className, 
  children, 
  ...props 
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  >
    {children}
  </div>
);

/**
 * ModalClose 元件
 */
const ModalClose = DialogPrimitive.Close;

// 設定 displayName
Modal.displayName = "Modal";
ModalHeader.displayName = "ModalHeader";
ModalTitle.displayName = "ModalTitle";
ModalDescription.displayName = "ModalDescription";
ModalContent.displayName = "ModalContent";
ModalFooter.displayName = "ModalFooter";

export {
  Modal,
  ModalTrigger,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ModalClose,
  modalContentVariants
};

// 便利 Hook：useModal
export const useModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen(prev => !prev), []);
  
  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen
  };
};