import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { createCustomer, getCustomer } from '../../services/firebase/customers';
import { getFirebaseDb } from '../../services/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

export function FirebaseTestScreen() {
  const { user } = useAuthStore();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('測試客戶');
  const [lastCreatedId, setLastCreatedId] = useState<string>('');

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${result}`]);
  };

  // 測試 1: 檢查使用者狀態
  const testUserAuth = () => {
    addTestResult('=== 測試使用者驗證 ===');
    if (user) {
      addTestResult(`✅ 已登入使用者: ${user.email}`);
      addTestResult(`使用者 ID: ${user.uid}`);
      addTestResult(`組織 ID: ${user.organizationId}`);
    } else {
      addTestResult('❌ 未登入');
    }
  };

  // 測試 2: 建立客戶
  const testCreateCustomer = async () => {
    addTestResult('=== 測試建立客戶 ===');
    
    if (!user) {
      addTestResult('❌ 需要先登入');
      return;
    }

    try {
      const newCustomer = await createCustomer({
        name: customerName,
        company: '測試公司',
        email: 'test@example.com',
        phone: '0912345678',
        organizationId: user.organizationId || '',
        teamMembers: [user.uid]
      }, user.uid);

      addTestResult(`✅ 客戶建立成功! ID: ${newCustomer.id}`);
      setLastCreatedId(newCustomer.id || '');
    } catch (error) {
      addTestResult(`❌ 建立失敗: ${error.message}`);
      console.error('建立客戶失敗:', error);
    }
  };

  // 測試 3: 讀取客戶
  const testReadCustomer = async () => {
    addTestResult('=== 測試讀取客戶 ===');
    
    if (!user) {
      addTestResult('❌ 需要先登入');
      return;
    }

    if (!lastCreatedId) {
      addTestResult('❌ 請先建立一個客戶');
      return;
    }

    try {
      const customer = await getCustomer(lastCreatedId, user.uid);
      if (customer) {
        addTestResult(`✅ 成功讀取客戶: ${customer.name}`);
        addTestResult(`公司: ${customer.company}`);
      } else {
        addTestResult('❌ 找不到客戶');
      }
    } catch (error) {
      addTestResult(`❌ 讀取失敗: ${error.message}`);
      console.error('讀取客戶失敗:', error);
    }
  };

  // 測試 4: 直接查詢 Firestore
  const testDirectQuery = async () => {
    addTestResult('=== 測試直接查詢 Firestore ===');
    
    if (!user) {
      addTestResult('❌ 需要先登入');
      return;
    }

    try {
      const db = getFirebaseDb();
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, where('createdBy', '==', user.uid));
      const snapshot = await getDocs(q);
      
      addTestResult(`✅ 查詢成功，找到 ${snapshot.size} 個客戶`);
      
      snapshot.forEach(doc => {
        const data = doc.data();
        addTestResult(`- ${data.name} (${doc.id})`);
      });
    } catch (error) {
      addTestResult(`❌ 查詢失敗: ${error.message}`);
      console.error('直接查詢失敗:', error);
    }
  };
  
  // 測試 5: 查詢所有客戶（不加條件）
  const testQueryAllCustomers = async () => {
    addTestResult('=== 測試查詢所有客戶（無條件） ===');
    
    if (!user) {
      addTestResult('❌ 需要先登入');
      return;
    }

    try {
      const db = getFirebaseDb();
      const customersRef = collection(db, 'customers');
      const snapshot = await getDocs(customersRef);
      
      addTestResult(`✅ 查詢成功，找到 ${snapshot.size} 個客戶`);
      
      let count = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (count < 5) {  // 只顯示前 5 個
          addTestResult(`- ${data.name} (${doc.id}) - createdBy: ${data.createdBy}`);
        }
        count++;
      });
      
      if (count > 5) {
        addTestResult(`... 還有 ${count - 5} 個客戶`);
      }
    } catch (error) {
      addTestResult(`❌ 查詢失敗: ${error.message}`);
      console.error('查詢所有客戶失敗:', error);
    }
  };

  // 初始化時檢查狀態
  useEffect(() => {
    testUserAuth();
  }, [user]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Firebase 測試工具</Text>
        <Text style={styles.subtitle}>測試資料是否能正確儲存和讀取</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>測試控制台</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>客戶名稱：</Text>
          <TextInput
            style={styles.input}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="輸入客戶名稱"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={testCreateCustomer}>
          <Text style={styles.buttonText}>1. 建立測試客戶</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testReadCustomer}>
          <Text style={styles.buttonText}>2. 讀取剛建立的客戶</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testDirectQuery}>
          <Text style={styles.buttonText}>3. 查詢所有我的客戶</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testQueryAllCustomers}>
          <Text style={styles.buttonText}>4. 查詢所有客戶（診斷用）</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={() => setTestResults([])}
        >
          <Text style={styles.buttonText}>清除結果</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>測試結果</Text>
        <View style={styles.results}>
          {testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>{result}</Text>
          ))}
          {testResults.length === 0 && (
            <Text style={styles.placeholder}>點擊上方按鈕開始測試</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginRight: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  results: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 5,
    minHeight: 200,
  },
  resultText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 5,
    color: '#333',
  },
  placeholder: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});