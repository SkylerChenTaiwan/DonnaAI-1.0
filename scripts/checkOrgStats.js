const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkOrgStats() {
  const orgId = '1HuFLKCrQBOQUp3cURLv';
  const orgDoc = await db.collection('organizations').doc(orgId).get();
  const data = orgDoc.data();
  
  console.log('組織資料:');
  console.log('- ID:', orgId);
  console.log('- 名稱:', data.name || data.businessName);
  console.log('- stats.activeUsers:', data.stats?.activeUsers);
  console.log('- stats.userCount:', data.stats?.userCount);
  console.log('- monthlyUsage.activeUsers:', data.monthlyUsage?.activeUsers);
  console.log('- monthlyUsage.period:', data.monthlyUsage?.period);
  console.log('完整 monthlyUsage:', JSON.stringify(data.monthlyUsage, null, 2));
  console.log('完整 stats:', JSON.stringify(data.stats, null, 2));
}

checkOrgStats().then(() => process.exit(0));
