/**
 * Notion 資料庫表格樣式定義
 */

import { StyleSheet, Platform } from 'react-native';
import { NotionColors, NotionSpacing, NotionTypography, NotionTable, NotionEditor } from '../constants';

export const tableStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NotionColors.background.default,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: NotionColors.ui.border },
  
  scrollContainer: {
    flex: 1,
    position: 'relative' as any },
  
  table: {
    flex: 1,
    width: '100%' },
  
  // Header styles
  headerContainer: {
    flexDirection: 'row',
    height: NotionSpacing.header.height,
    backgroundColor: NotionTable.header.background,
    borderBottomWidth: 1,
    borderBottomColor: NotionColors.ui.border,
    zIndex: 10 },
  
  headerCell: {
    paddingHorizontal: NotionSpacing.header.paddingHorizontal,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: NotionColors.ui.border },
  
  headerText: {
    fontSize: NotionTable.header.fontSize,
    fontWeight: NotionTable.header.fontWeight as any,
    color: NotionTable.header.color,
    fontFamily: NotionTypography.fontFamily },
  
  headerResizeHandle: {
    position: 'absolute',
    right: -3,
    top: 0,
    bottom: 0,
    width: 6,
    cursor: 'col-resize',
    zIndex: 20 },
  
  // Row styles
  row: {
    flexDirection: 'row',
    height: NotionTable.row.height,
    backgroundColor: NotionTable.row.backgroundEven,
    borderBottomWidth: 1,
    borderBottomColor: NotionColors.ui.border },
  
  rowHover: {
    backgroundColor: NotionTable.row.backgroundHover },
  
  rowSelected: {
    backgroundColor: NotionColors.interactive.selected },
  
  // Cell styles
  cell: {
    paddingHorizontal: NotionSpacing.cell.paddingHorizontal,
    paddingVertical: NotionSpacing.cell.paddingVertical,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: NotionColors.ui.border,
    backgroundColor: NotionTable.cell.background,
    minHeight: NotionSpacing.cell.minHeight,
    position: 'relative' as any },
  
  cellHover: {
    backgroundColor: NotionTable.cell.backgroundHover },
  
  cellSelected: {
    borderWidth: 2,
    borderColor: NotionColors.interactive.selectedBorder,
    margin: -1, // Compensate for border
  },
  
  cellEditing: {
    padding: 0,
    borderWidth: 2,
    borderColor: NotionColors.interactive.focus,
    margin: -1 },
  
  cellText: {
    fontSize: NotionTable.cell.fontSize,
    color: NotionTable.cell.color,
    fontFamily: NotionTypography.fontFamily,
    lineHeight: NotionTypography.lineHeight.body },
  
  // Editor styles
  editorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: NotionEditor.background,
    zIndex: 100 },
  
  editorInput: {
    flex: 1,
    fontSize: NotionEditor.fontSize,
    fontFamily: NotionTypography.fontFamily,
    color: NotionColors.text.default,
    padding: NotionEditor.padding,
    margin: 0,
    borderWidth: NotionEditor.outline.width,
    borderColor: NotionEditor.outline.color,
    borderRadius: NotionEditor.borderRadius,
    outlineWidth: 0,
    outlineStyle: 'none' as any,
    backgroundColor: NotionEditor.background },
  
  // Select/Tag styles
  selectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 4 },
  
  selectTagText: {
    fontSize: 12,
    fontWeight: '500' },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: NotionSpacing.xl },
  
  emptyText: {
    fontSize: NotionTypography.fontSize.body,
    color: NotionColors.text.gray,
    textAlign: 'center' },
  
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center' },
  
  // Add row button
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: NotionSpacing.sm,
    backgroundColor: NotionColors.background.default,
    borderTopWidth: 1,
    borderTopColor: NotionColors.ui.border },
  
  addRowText: {
    fontSize: NotionTypography.fontSize.body,
    color: NotionColors.text.gray,
    marginLeft: NotionSpacing.xs },
  
  // Checkbox styles
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: NotionColors.ui.border,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center' },
  
  checkboxChecked: {
    backgroundColor: NotionColors.interactive.focus,
    borderColor: NotionColors.interactive.focus },
  
  // Web-specific styles
  ...(Platform.OS === 'web' ? {
    webScrollbar: {
      '::-webkit-scrollbar': {
        width: 12,
        height: 12 },
      '::-webkit-scrollbar-track': {
        background: NotionColors.background.default },
      '::-webkit-scrollbar-thumb': {
        background: NotionColors.ui.scrollbar,
        borderRadius: 6,
        border: '2px solid transparent',
        backgroundClip: 'padding-box' },
      '::-webkit-scrollbar-thumb:hover': {
        background: NotionColors.text.gray } } } : {}) });

// Helper function to get cell state styles
export const getCellStyles = (state: 'default' | 'hover' | 'selected' | 'editing') => {
  const styles = [tableStyles.cell];
  
  switch (state) {
    case 'hover':
      styles.push(tableStyles.cellHover);
      break;
    case 'selected':
      styles.push(tableStyles.cellSelected);
      break;
    case 'editing':
      styles.push(tableStyles.cellEditing);
      break;
  }
  
  return styles;
};

// Helper function to get row state styles
export const getRowStyles = (isHovered: boolean, isSelected: boolean) => {
  const styles = [tableStyles.row];
  
  if (isSelected) {
    styles.push(tableStyles.rowSelected);
  } else if (isHovered) {
    styles.push(tableStyles.rowHover);
  }
  
  return styles;
};