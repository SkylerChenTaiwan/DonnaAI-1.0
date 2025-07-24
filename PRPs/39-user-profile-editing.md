# PRP-39: 用戶個人資料編輯功能

## 概述
實作設定頁面中的用戶個人資料編輯功能，讓用戶可以更新他們的名字和電子郵件地址。此功能需要同時更新 Firebase Authentication 和 Firestore 中的資料。

## 背景與需求
目前設定頁面（`SettingsScreen.tsx`）僅顯示用戶資訊，但無法編輯。用戶需要能夠：
1. 編輯他們的顯示名稱
2. 更新電子郵件地址（需要重新驗證）
3. 在更新後立即看到變更反映在應用程式中

## 技術架構參考

### 現有模式分析
1. **設定頁面結構** (`src/screens/settings/SettingsScreen.tsx:231-239`)
   - 目前顯示用戶資訊為靜態文字
   - 需要新增編輯按鈕觸發編輯模式

2. **模態表單模式** (`src/screens/modals/EditCustomerModal.tsx`)
   - 標準的編輯流程：載入資料 → 表單編輯 → 驗證 → 保存
   - 使用 `useState` 管理表單狀態
   - 使用 `Alert` 顯示錯誤訊息

3. **用戶資料結構** (`src/types/user.ts:5-24`)
   ```typescript
   interface User {
     id: string;
     email: string;
     name: string;
     // ... 其他欄位
   }
   ```

4. **認證服務缺失** (`src/services/firebase/auth.ts`)
   - 缺少 `updateEmail` 和 `updateProfile` 的實作
   - 需要新增這些方法

## 實作計劃

### 1. 建立 Firebase 認證更新服務
```typescript
// src/services/firebase/auth.ts 新增

import { updateEmail as firebaseUpdateEmail, updateProfile, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

/**
 * 更新用戶名稱
 */
export const updateUserName = async (name: string): Promise<void> => {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('用戶未登入');
  
  // 更新 Firebase Auth
  await updateProfile(user, { displayName: name });
  
  // 更新 Firestore
  const userRef = doc(getFirebaseDb(), 'users', user.uid);
  await updateDoc(userRef, { 
    name,
    updatedAt: serverTimestamp()
  });
};

/**
 * 更新用戶電子郵件
 * 需要重新驗證用戶
 */
export const updateUserEmail = async (newEmail: string, currentPassword: string): Promise<void> => {
  const user = getFirebaseAuth().currentUser;
  if (!user || !user.email) throw new Error('用戶未登入');
  
  // 重新驗證用戶
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  
  // 更新 Firebase Auth
  await firebaseUpdateEmail(user, newEmail);
  
  // 更新 Firestore
  const userRef = doc(getFirebaseDb(), 'users', user.uid);
  await updateDoc(userRef, { 
    email: newEmail,
    updatedAt: serverTimestamp()
  });
};
```

### 2. 建立編輯個人資料模態組件
參考 `EditCustomerModal.tsx` 的模式：

```typescript
// src/screens/modals/EditProfileModal.tsx
export const EditProfileModal: React.FC = () => {
  // 表單狀態管理
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '' // 更新 email 時需要
  });
  
  // 驗證邏輯
  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('錯誤', '請輸入姓名');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('錯誤', '請輸入有效的電子郵件地址');
      return false;
    }
    
    if (formData.email !== user?.email && !formData.currentPassword) {
      Alert.alert('錯誤', '更改電子郵件需要輸入目前密碼');
      return false;
    }
    
    return true;
  };
  
  // 保存邏輯
  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      // 更新名稱
      if (formData.name !== user?.name) {
        await updateUserName(formData.name);
      }
      
      // 更新電子郵件
      if (formData.email !== user?.email) {
        await updateUserEmail(formData.email, formData.currentPassword);
      }
      
      // 更新本地狀態
      await authStore.refreshUser();
      
      navigation.goBack();
      Alert.alert('成功', '個人資料已更新');
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsSaving(false);
    }
  };
};
```

### 3. 更新 AuthStore 以支援用戶資料刷新
```typescript
// src/stores/authStore.ts 新增
refreshUser: async () => {
  const currentUser = getFirebaseAuth().currentUser;
  if (!currentUser) return;
  
  const userDoc = await getDoc(doc(getFirebaseDb(), 'users', currentUser.uid));
  if (userDoc.exists()) {
    set({ 
      user: { ...userDoc.data(), id: currentUser.uid } as User,
      firebaseUser: currentUser
    });
  }
}
```

### 4. 更新設定頁面新增編輯按鈕
```typescript
// src/screens/settings/SettingsScreen.tsx 修改用戶資訊區塊
<View style={styles.userInfo}>
  <View style={styles.userDetails}>
    <Text style={styles.userName}>{user?.name || '使用者'}</Text>
    <Text style={styles.userEmail}>{user?.email || ''}</Text>
    <Text style={styles.userRole}>
      {mode === 'manager' ? '主管模式' : '業務模式'}
    </Text>
  </View>
  <TouchableOpacity 
    style={styles.editButton}
    onPress={() => navigation.navigate('EditProfileModal')}
  >
    <Ionicons name="pencil" size={20} color="#007AFF" />
  </TouchableOpacity>
</View>
```

### 5. 更新導航類型定義
```typescript
// src/types/navigation.ts
export type RootStackParamList = {
  // ... 現有路由
  EditProfileModal: undefined;
};
```

### 6. 錯誤處理
參考現有錯誤處理模式，建立專門的錯誤處理函數：

```typescript
const handleAuthError = (error: any) => {
  switch (error.code) {
    case 'auth/requires-recent-login':
      Alert.alert('需要重新登入', '為了安全考量，請重新登入後再嘗試更新電子郵件');
      break;
    case 'auth/email-already-in-use':
      Alert.alert('錯誤', '此電子郵件已被使用');
      break;
    case 'auth/invalid-email':
      Alert.alert('錯誤', '電子郵件格式無效');
      break;
    case 'auth/wrong-password':
      Alert.alert('錯誤', '密碼錯誤');
      break;
    default:
      Alert.alert('錯誤', error.message || '更新失敗，請稍後再試');
  }
};
```

## 實作步驟

1. **建立 Firebase 更新服務** (30分鐘)
   - 在 `src/services/firebase/auth.ts` 新增 `updateUserName` 和 `updateUserEmail` 方法
   - 處理 Firebase Auth 和 Firestore 的雙重更新
   - 實作重新驗證邏輯

2. **建立編輯個人資料模態** (45分鐘)
   - 建立 `src/screens/modals/EditProfileModal.tsx`
   - 實作表單驗證和狀態管理
   - 加入密碼輸入欄位（僅在更改 email 時顯示）

3. **更新 AuthStore** (15分鐘)
   - 新增 `refreshUser` 方法
   - 確保更新後立即反映在應用程式中

4. **更新設定頁面** (15分鐘)
   - 新增編輯按鈕
   - 連接導航到編輯模態

5. **更新導航設定** (10分鐘)
   - 在 `AppNavigator.tsx` 新增路由
   - 更新導航類型定義

6. **測試與驗證** (30分鐘)
   - 測試名稱更新流程
   - 測試電子郵件更新流程（含密碼驗證）
   - 測試錯誤情況處理

## 驗證檢查點

```bash
# 1. TypeScript 類型檢查
npm run tsc --noEmit

# 2. 編譯檢查
npx expo export --platform ios --output-dir ./dist-ios

# 3. 功能測試檢查清單
- [ ] 可以成功更新名稱
- [ ] 可以成功更新電子郵件（需要密碼）
- [ ] 更新後立即在設定頁面看到變更
- [ ] 錯誤訊息正確顯示
- [ ] 載入狀態正確顯示
- [ ] 可以取消編輯返回設定頁面
```

## 風險與注意事項

1. **Firebase 安全規則**
   - 確保用戶只能更新自己的資料
   - 現有規則應該已經支援，但需要驗證

2. **電子郵件更新限制**
   - Firebase 要求重新驗證才能更新敏感資訊
   - 需要處理 `auth/requires-recent-login` 錯誤

3. **資料同步**
   - 確保 Firebase Auth 和 Firestore 資料保持同步
   - 使用交易或批次更新來確保原子性

4. **UI/UX 考量**
   - 更新 email 時需要明確告知用戶需要輸入密碼
   - 成功更新後提供明確的回饋

## 參考資源

1. [Firebase Update Email Documentation](https://firebase.google.com/docs/auth/web/manage-users#update_a_users_email_address)
2. [Firebase Reauthenticate Documentation](https://firebase.google.com/docs/auth/web/manage-users#re-authenticate_a_user)
3. 現有程式碼參考：
   - `src/screens/modals/EditCustomerModal.tsx` - 表單模式參考
   - `src/services/firebase/auth.ts` - 認證服務基礎
   - `src/screens/settings/SettingsScreen.tsx` - 設定頁面結構

## 完成標準

- ✅ 用戶可以更新顯示名稱
- ✅ 用戶可以更新電子郵件（需密碼驗證）
- ✅ 更新立即反映在應用程式中
- ✅ 適當的錯誤處理和用戶提示
- ✅ 符合現有 UI/UX 設計模式

**信心評分：9/10**

此 PRP 提供了完整的實作指南，包含所有必要的程式碼範例、錯誤處理和驗證步驟。唯一的不確定性是 Firebase 安全規則，但現有規則應該已經支援用戶更新自己的資料。