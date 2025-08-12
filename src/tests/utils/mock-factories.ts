import { faker } from '@faker-js/faker';

// 用戶 Mock 工廠
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: faker.helpers.arrayElement(['user', 'admin', 'manager']),
    organizationId: faker.string.uuid(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    isActive: true,
    ...overrides
  };
}

// 組織 Mock 工廠
export function createMockOrganization(overrides: Partial<any> = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    description: faker.company.catchPhrase(),
    adminId: faker.string.uuid(),
    plan: faker.helpers.arrayElement(['free', 'basic', 'premium', 'enterprise']),
    userCount: faker.number.int({ min: 1, max: 100 }),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    settings: {
      allowUserRegistration: true,
      defaultRole: 'user',
      features: []
    },
    ...overrides
  };
}

// 客戶 Mock 工廠
export function createMockCustomer(overrides: Partial<any> = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    company: faker.company.name(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    status: faker.helpers.arrayElement(['active', 'inactive', 'prospect']),
    assignedTo: faker.string.uuid(),
    organizationId: faker.string.uuid(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    tags: faker.helpers.arrayElements(['vip', 'new', 'returning', 'high-value'], 2),
    notes: faker.lorem.paragraph(),
    ...overrides
  };
}

// 記錄 Mock 工廠
export function createMockRecord(overrides: Partial<any> = {}) {
  return {
    id: faker.string.uuid(),
    type: faker.helpers.arrayElement(['meeting', 'call', 'email', 'note']),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(2),
    customerId: faker.string.uuid(),
    userId: faker.string.uuid(),
    organizationId: faker.string.uuid(),
    date: faker.date.recent(),
    duration: faker.number.int({ min: 15, max: 120 }),
    attachments: [],
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides
  };
}

// 任務 Mock 工廠
export function createMockTask(overrides: Partial<any> = {}) {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement(['pending', 'in_progress', 'completed', 'cancelled']),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
    dueDate: faker.date.future(),
    assignedTo: faker.string.uuid(),
    customerId: faker.string.uuid(),
    organizationId: faker.string.uuid(),
    createdBy: faker.string.uuid(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    completedAt: null,
    tags: faker.helpers.arrayElements(['follow-up', 'important', 'client-request'], 2),
    ...overrides
  };
}

// 檔案 Mock 工廠
export function createMockFile(overrides: Partial<any> = {}) {
  const fileTypes = ['pdf', 'doc', 'xlsx', 'png', 'jpg'];
  const fileType = faker.helpers.arrayElement(fileTypes);
  
  return {
    id: faker.string.uuid(),
    name: `${faker.system.fileName()}.${fileType}`,
    type: `application/${fileType}`,
    size: faker.number.int({ min: 1000, max: 10000000 }),
    url: faker.internet.url(),
    uploadedBy: faker.string.uuid(),
    organizationId: faker.string.uuid(),
    createdAt: faker.date.past(),
    metadata: {
      width: fileType.includes('png') || fileType.includes('jpg') ? faker.number.int({ min: 100, max: 2000 }) : undefined,
      height: fileType.includes('png') || fileType.includes('jpg') ? faker.number.int({ min: 100, max: 2000 }) : undefined,
      pages: fileType === 'pdf' ? faker.number.int({ min: 1, max: 100 }) : undefined
    },
    ...overrides
  };
}

// API 回應 Mock 工廠
export function createMockApiResponse<T>(data: T, overrides: Partial<any> = {}) {
  return {
    success: true,
    data,
    message: 'Success',
    timestamp: new Date().toISOString(),
    ...overrides
  };
}

// 錯誤回應 Mock 工廠
export function createMockErrorResponse(overrides: Partial<any> = {}) {
  return {
    success: false,
    error: {
      code: faker.helpers.arrayElement(['AUTH_ERROR', 'VALIDATION_ERROR', 'NOT_FOUND', 'SERVER_ERROR']),
      message: faker.lorem.sentence(),
      details: faker.lorem.paragraph()
    },
    timestamp: new Date().toISOString(),
    ...overrides
  };
}

// 分頁資料 Mock 工廠
export function createMockPaginatedData<T>(
  itemFactory: () => T,
  options: {
    page?: number;
    pageSize?: number;
    total?: number;
  } = {}
) {
  const { page = 1, pageSize = 10, total = 100 } = options;
  const items = Array.from({ length: pageSize }, itemFactory);
  
  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page * pageSize < total,
      hasPrevious: page > 1
    }
  };
}

// Firebase Mock 工廠
export function createMockFirebaseUser(overrides: Partial<any> = {}) {
  return {
    uid: faker.string.uuid(),
    email: faker.internet.email(),
    emailVerified: true,
    displayName: faker.person.fullName(),
    photoURL: faker.image.avatar(),
    phoneNumber: faker.phone.number(),
    isAnonymous: false,
    metadata: {
      creationTime: faker.date.past().toISOString(),
      lastSignInTime: faker.date.recent().toISOString()
    },
    getIdToken: () => Promise.resolve(faker.string.alphanumeric(100)),
    reload: () => Promise.resolve(),
    ...overrides
  };
}

// Firestore 文檔 Mock 工廠
export function createMockFirestoreDoc(data: any, overrides: Partial<any> = {}) {
  return {
    id: faker.string.uuid(),
    exists: true,
    data: () => data,
    get: (field: string) => data[field],
    ref: {
      id: faker.string.uuid(),
      path: `collection/${faker.string.uuid()}`,
      parent: null
    },
    ...overrides
  };
}

// Firestore 查詢快照 Mock 工廠
export function createMockFirestoreQuerySnapshot(documents: any[]) {
  return {
    empty: documents.length === 0,
    size: documents.length,
    docs: documents.map(doc => createMockFirestoreDoc(doc)),
    forEach: (callback: (doc: any) => void) => {
      documents.forEach(doc => callback(createMockFirestoreDoc(doc)));
    }
  };
}

// CSV 資料 Mock 工廠
export function createMockCsvData(rows: number = 10) {
  const headers = ['Name', 'Email', 'Phone', 'Company', 'Status'];
  const data = [headers];
  
  for (let i = 0; i < rows; i++) {
    data.push([
      faker.person.fullName(),
      faker.internet.email(),
      faker.phone.number(),
      faker.company.name(),
      faker.helpers.arrayElement(['Active', 'Inactive', 'Pending'])
    ]);
  }
  
  return data;
}

// 表單資料 Mock 工廠
export function createMockFormData(fields: Record<string, any> = {}) {
  const formData = new FormData();
  
  Object.entries(fields).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });
  
  return formData;
}

// 測試檔案 Mock 工廠
export function createMockTestFile(overrides: Partial<File> = {}): File {
  const content = faker.lorem.paragraphs(3);
  const blob = new Blob([content], { type: 'text/plain' });
  
  return new File([blob], faker.system.fileName() + '.txt', {
    type: 'text/plain',
    lastModified: Date.now(),
    ...overrides
  });
}

// WebSocket 訊息 Mock 工廠
export function createMockWebSocketMessage(overrides: Partial<any> = {}) {
  return {
    type: faker.helpers.arrayElement(['message', 'notification', 'update', 'error']),
    payload: {
      id: faker.string.uuid(),
      content: faker.lorem.sentence(),
      timestamp: new Date().toISOString()
    },
    ...overrides
  };
}

// 權限 Mock 工廠
export function createMockPermissions(overrides: Partial<any> = {}) {
  return {
    canRead: true,
    canWrite: faker.datatype.boolean(),
    canDelete: faker.datatype.boolean(),
    canManageUsers: faker.datatype.boolean(),
    canManageSettings: faker.datatype.boolean(),
    canExport: true,
    canImport: faker.datatype.boolean(),
    ...overrides
  };
}