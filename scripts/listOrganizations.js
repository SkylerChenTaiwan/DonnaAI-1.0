const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function listOrganizations() {
  const orgsSnapshot = await db.collection('organizations').get();
  console.log('找到的組織:');
  orgsSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id}, 名稱: ${data.name || data.businessName}`);
  });
  
  // 檢查特定組織的用戶
  console.log('\n檢查各組織的用戶數:');
  for (const doc of orgsSnapshot.docs) {
    const usersSnapshot = await db.collection('users')
      .where('organizationId', '==', doc.id)
      .get();
    console.log(`${doc.id}: ${usersSnapshot.size} 個用戶`);
  }
}

listOrganizations().then(() => process.exit(0));