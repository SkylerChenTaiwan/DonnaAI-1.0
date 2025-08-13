/**
 * IntelligentFieldMapper 元件樣式
 */

import { StyleSheet , Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff' },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC' },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#37352F',
    marginBottom: 8 },
  headerInfo: {
    flexDirection: 'row',
    gap: 16 },
  infoText: {
    fontSize: 14,
    color: '#787774' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40 },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#787774' },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC' },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8 },
  secondaryButton: {
    backgroundColor: '#F7F6F3' },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff' },
  secondaryText: {
    color: '#666' },
  mappingList: {
    flex: 1 },
  mappingHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F7F6F3',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC' },
  columnHeader: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#787774',
    textTransform: 'uppercase',
    letterSpacing: 0.5 },
  mappingRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFED',
    alignItems: 'center' },
  selectedRow: {
    backgroundColor: '#F7F6F3' },
  sourceField: {
    flex: 1 },
  fieldName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#37352F',
    marginBottom: 2 },
  fieldType: {
    fontSize: 12,
    color: '#787774',
    marginBottom: 2 },
  sampleData: {
    fontSize: 11,
    color: '#ACA9A5',
    fontStyle: 'italic' },
  arrow: {
    paddingHorizontal: 16 },
  targetField: {
    flex: 1 },
  picker: {
    height: 36,
    backgroundColor: '#F7F6F3',
    borderRadius: 4 },
  webPicker: {
    width: '100%',
    height: 36,
    padding: '8px 12px',
    backgroundColor: '#F7F6F3',
    border: '1px solid #E3E1DC',
    borderRadius: 4,
    fontSize: 14,
    color: '#37352F',
    cursor: 'pointer',
    outline: 'none' },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    marginTop: 4 },
  suggestionText: {
    fontSize: 12,
    color: '#2E7D32' },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10 },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff' },
  mappingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4 },
  alternativesSection: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E3E1DC',
    borderRadius: 8,
    padding: 12,
    zIndex: 10,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }) }),
    shadowOpacity: 0.1,
    shadowRadius: 4,
    ...(Platform.OS === 'web' ? {} : { elevation: 3 }) },
  alternativesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#787774',
    marginBottom: 8 },
  alternativeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFED' },
  alternativeText: {
    fontSize: 13,
    color: '#37352F' },
  alternativeConfidence: {
    fontSize: 12,
    color: '#787774' },
  unmappedSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2' },
  unmappedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center' },
  unmappedField: {
    marginBottom: 12 },
  unmappedFieldName: {
    fontSize: 13,
    color: '#37352F',
    marginBottom: 4 },
  defaultValuePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 16 },
  defaultLabel: {
    fontSize: 12,
    color: '#787774' },
  pickerSmall: {
    flex: 1,
    height: 32,
    backgroundColor: '#fff' },
  webPickerSmall: {
    flex: 1,
    height: 32,
    padding: '4px 8px',
    backgroundColor: '#fff',
    border: '1px solid #E3E1DC',
    borderRadius: 4,
    fontSize: 12,
    color: '#37352F' },
  advancedSection: {
    padding: 16,
    backgroundColor: '#F7F6F3',
    borderTopWidth: 1,
    borderTopColor: '#E3E1DC' },
  advancedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#37352F',
    marginBottom: 12 },
  advancedOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8 },
  advancedLabel: {
    fontSize: 13,
    color: '#787774' },
  advancedValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#37352F' },
  summary: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E3E1DC',
    backgroundColor: '#FAFAF9' },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#37352F',
    marginBottom: 12 },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around' },
  statItem: {
    alignItems: 'center',
    gap: 4 },
  statLabel: {
    fontSize: 12,
    color: '#787774' },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#37352F' } });