/**
 * Notion 風格核取方塊元件
 */

import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { NotionCheckboxProps } from '../shared/tableTypes';

export const NotionCheckbox: React.FC<NotionCheckboxProps> = ({
  checked,
  onChange,
  indeterminate = false,
  disabled = false }) => {
  const checkboxRef = useRef<HTMLInputElement>(null);

  // 設定 indeterminate 狀態
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const handlePress = () => {
    if (disabled) return;
    onChange(!checked);
  };

  return (
    <TouchableOpacity
      style={StyleSheet.flatten([
        styles.container,
        disabled && styles.disabledContainer,
      ])}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={styles.hiddenInput}
        tabIndex={-1}
      />
      <View style={StyleSheet.flatten([
        styles.checkbox,
        checked && styles.checkedCheckbox,
        indeterminate && styles.indeterminateCheckbox,
        disabled && styles.disabledCheckbox,
      ])}>
        {checked && !indeterminate && (
          <CheckIcon />
        )}
        {indeterminate && (
          <IndeterminateIcon />
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * 勾選圖示
 */
const CheckIcon: React.FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 3L4.5 8.5L2 6"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 部分選取圖示
 */
const IndeterminateIcon: React.FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 6H9.5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const styles = StyleSheet.create({
  container: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any },
  disabledContainer: {
    cursor: 'not-allowed' as any,
    opacity: 0.5 },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
    width: 0,
    height: 0 },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#d3d3d3',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease' },
  checkedCheckbox: {
    backgroundColor: '#0f7b0f',
    borderColor: '#0f7b0f' },
  indeterminateCheckbox: {
    backgroundColor: '#0f7b0f',
    borderColor: '#0f7b0f' },
  disabledCheckbox: {
    backgroundColor: '#f1f1ef',
    borderColor: '#e9e9e7' } });