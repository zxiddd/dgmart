const { db } = require('../config/firebase');

async function testConnection() {
    try {
        console.log('Testing Firestore connection...');
        const docRef = db.collection('test_collection').doc('test_doc');
        await docRef.set({
            message: 'Hello Firestore',
            timestamp: new Date().toISOString()
        });
        console.log('✅ Write successful!');

        const doc = await docRef.get();
        console.log('✅ Read successful:', doc.data());
        process.exit(0);
    } catch (error) {
        console.error('❌ Firestore Error:', error);
        process.exit(1);
    }
}

testConnection();
