/**
 * 統一的按鈕樣式常量
 * 供 TouchableOpacity 元件使用
 */

import { StyleSheet } from 'react-native';
import { DesignSystem } from '@/theme/designSystem';

/**
 * 基礎按鈕樣式
 */
export const baseButtonStyle = {
  borderRadius: DesignSystem.borderRadius.button,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  ...DesignSystem.shadows.none };

/**
 * 通用按鈕樣式
 */
export const ButtonStyles = StyleSheet.create({
  // 主要動作按鈕
  primaryButton: {
    ...baseButtonStyle,
    backgroundColor: DesignSystem.colors.button.primary.default,
    paddingHorizontal: 16,
    paddingVertical: 8 },
  
  // 次要動作按鈕
  secondaryButton: {
    ...baseButtonStyle,
    backgroundColor: DesignSystem.colors.button.secondary.default,
    paddingHorizontal: 16,
    paddingVertical: 8 },
  
  // 輪廓按鈕
  outlineButton: {
    ...baseButtonStyle,
    backgroundColor: DesignSystem.colors.button.outline.background,
    borderWidth: 1,
    borderColor: DesignSystem.colors.button.outline.border,
    paddingHorizontal: 16,
    paddingVertical: 8 },
  
  // Ghost 按鈕（透明背景）
  ghostButton: {
    ...baseButtonStyle,
    backgroundColor: DesignSystem.colors.button.ghost.background,
    paddingHorizontal: 16,
    paddingVertical: 8 },
  
  // 圖標按鈕（小尺寸）
  iconButton: {
    ...baseButtonStyle,
    width: 36,
    height: 36,
    padding: 8 },
  
  // 返回按鈕
  backButton: {
    ...baseButtonStyle,
    padding: 8,
    marginRight: 8,
    backgroundColor: 'transparent' },
  
  // 關閉按鈕
  closeButton: {
    ...baseButtonStyle,
    padding: 8,
    backgroundColor: 'transparent' },
  
  // 浮動動作按鈕
  fab: {
    ...baseButtonStyle,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DesignSystem.colors.button.primary.default },
  
  // 底部動作按鈕（用於模態框底部）
  bottomActionButton: {
    ...baseButtonStyle,
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 8 },
  
  // 列表項目按鈕
  listItemButton: {
    padding: 16,
    backgroundColor: 'transparent',
    borderRadius: DesignSystem.borderRadius.button },
  
  // 標籤按鈕
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'transparent' },
  
  // 文字按鈕
  textButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0 } });

/**
 * 按鈕文字樣式
 */
export const ButtonTextStyles = StyleSheet.create({
  primaryText: {
    color: DesignSystem.colors.text.inverse,
    fontSize: 14,
    fontWeight: '500' as const },
  
  secondaryText: {
    color: DesignSystem.colors.primary,
    fontSize: 14,
    fontWeight: '500' as const },
  
  ghostText: {
    color: DesignSystem.colors.primary,
    fontSize: 14,
    fontWeight: '500' as const },
  
  linkText: {
    color: DesignSystem.colors.button.text.color,
    fontSize: 14,
    fontWeight: '400' as const,
    textDecorationLine: 'underline' as const,
    textDecorationStyle: 'solid' as const,
    textDecorationColor: DesignSystem.colors.button.text.underline },
  
  disabledText: {
    color: DesignSystem.colors.text.disabled } });

/**
 * 按鈕狀態樣式
 */
export const ButtonStateStyles = {
  disabled: {
    opacity: 0.5 },
  pressed: {
    opacity: 0.8 } };

/**
 * 便利函數：獲取按鈕樣式組合
 */
export const getButtonStyle = (
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary',
  disabled = false
) => {
  const variantStyles = {
    primary: ButtonStyles.primaryButton,
    secondary: ButtonStyles.secondaryButton,
    outline: ButtonStyles.outlineButton,
    ghost: ButtonStyles.ghostButton };
  
  return [
    variantStyles[variant],
    disabled && ButtonStateStyles.disabled,
  ].filter(Boolean);
};

/**
 * 便利函數：獲取按鈕文字樣式組合
 */
export const getButtonTextStyle = (
  variant: 'primary' | 'secondary' | 'ghost' | 'link' = 'primary',
  disabled = false
) => {
  const variantStyles = {
    primary: ButtonTextStyles.primaryText,
    secondary: ButtonTextStyles.secondaryText,
    ghost: ButtonTextStyles.ghostText,
    link: ButtonTextStyles.linkText };
  
  return [
    variantStyles[variant],
    disabled && ButtonTextStyles.disabledText,
  ].filter(Boolean);
};