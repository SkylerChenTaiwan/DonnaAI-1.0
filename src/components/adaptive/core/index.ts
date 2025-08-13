/**
 * Adaptive Components 核心元件匯出
 * 提供統一的跨平台元件 API 和匯入介面
 */

// 基礎容器元件
export {
  AdaptiveView,
  WebView,
  NativeView,
  FlexView,
  CenterView,
  RowView,
  ColumnView,
  ScrollView,
  ResponsiveView,
  createStyledAdaptiveView,
  type AdaptiveViewProps } from './AdaptiveView';

// 文字元件
export {
  AdaptiveText,
  WebText,
  NativeText,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  BodyText,
  SmallText,
  Caption,
  SuccessText,
  WarningText,
  ErrorText,
  InfoText,
  type AdaptiveTextProps,
  type TextVariant,
  type TextColor,
  type TextAlign } from './AdaptiveText';

// 按鈕元件
export {
  AdaptiveButton,
  WebButton,
  NativeButton,
  PrimaryButton,
  SecondaryButton,
  OutlineButton,
  GhostButton,
  TextButton,
  SmallButton,
  LargeButton,
  IconButton,
  type AdaptiveButtonProps,
  type ButtonVariant,
  type ButtonSize,
  type ButtonState } from './AdaptiveButton';

// 輸入框元件
export {
  AdaptiveInput,
  WebInput,
  NativeInput,
  EmailInput,
  PasswordInput,
  NumberInput,
  SearchInput,
  MultilineInput,
  type AdaptiveInputProps,
  type InputType,
  type InputState } from './AdaptiveInput';

// 選擇器元件
export {
  AdaptiveSelect,
  WebSelect,
  NativeSelect,
  SingleSelect,
  MultiSelect,
  SearchableSelect,
  ClearableSelect,
  type AdaptiveSelectProps,
  type SelectOption,
  type SelectOptionGroup,
  type SelectSize,
  type SelectState } from './AdaptiveSelect';

// 圖片元件
export {
  AdaptiveImage,
  WebImage,
  NativeImage,
  Avatar,
  Logo,
  Thumbnail,
  BackgroundImage,
  type AdaptiveImageProps,
  type ImageLoadState,
  type ImageResizeMode } from './AdaptiveImage';

// 模態框元件
export {
  AdaptiveModal,
  WebModal,
  NativeModal,
  ConfirmModal,
  AlertModal,
  type AdaptiveModalProps,
  type ModalSize,
  type ModalAnimationType,
  type ModalPosition } from './AdaptiveModal';

// 開關元件
export {
  AdaptiveSwitch,
  type AdaptiveSwitchProps,
  DEFAULT_COLORS as SWITCH_DEFAULT_COLORS } from './AdaptiveSwitch';

// 複選框元件
export {
  AdaptiveCheckbox,
  type AdaptiveCheckboxProps } from './AdaptiveCheckbox';

// 單選按鈕元件
export {
  AdaptiveRadio,
  AdaptiveRadioGroup,
  type AdaptiveRadioProps,
  type AdaptiveRadioGroupProps } from './AdaptiveRadio';

// 搜尋欄元件
export {
  AdaptiveSearchBar,
  type AdaptiveSearchBarProps } from './AdaptiveSearchBar';

// 日期選擇器元件
export {
  AdaptiveDatePicker,
  type AdaptiveDatePickerProps } from './AdaptiveDatePicker';

// 滑動條元件
export {
  AdaptiveSlider,
  type AdaptiveSliderProps } from './AdaptiveSlider';

// 卡片元件
export { AdaptiveCard } from './AdaptiveCard';

// 分隔線元件
export { AdaptiveDivider } from './AdaptiveDivider';

// 頭像元件
export { AdaptiveAvatar } from './AdaptiveAvatar';

// 標籤頁元件
export { AdaptiveTabs } from './AdaptiveTabs';

// 預設匯出 - 最常用的元件
export {
  AdaptiveView as View,
  AdaptiveText as Text,
  AdaptiveButton as Button,
  AdaptiveInput as Input,
  AdaptiveSelect as Select,
  AdaptiveImage as Image,
  AdaptiveModal as Modal } from './AdaptiveView';

// 重新匯出其他元件
export { AdaptiveText as Text } from './AdaptiveText';
export { AdaptiveButton as Button } from './AdaptiveButton';
export { AdaptiveInput as Input } from './AdaptiveInput';
export { AdaptiveSelect as Select } from './AdaptiveSelect';
export { AdaptiveImage as Image } from './AdaptiveImage';
export { AdaptiveModal as Modal } from './AdaptiveModal';
export { AdaptiveSwitch as Switch } from './AdaptiveSwitch';