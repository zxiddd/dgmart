const Razorpay = require('razorpay');
require('dotenv').config();

const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

console.log('--- Razorpay Diagnostic ---');
console.log('Key ID:', keyId ? `${keyId.substring(0, 14)}... (Length: ${keyId.length})` : 'MISSING');
console.log('Key Secret:', keySecret ? `${keySecret.substring(0, 3)}...${keySecret.substring(keySecret.length - 3)} (Length: ${keySecret.length})` : 'MISSING');

if (!keyId || !keySecret) {
    console.error('❌ Error: Missing credentials in .env');
    process.exit(1);
}

const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
});

console.log('\n📡 Attempting to fetch orders from Razorpay to verify credentials...');

razorpay.orders.all({ count: 1 })
    .then(result => {
        console.log('✅ Success! Authentication is working correctly.');
        console.log('Found orders:', result.items ? result.items.length : 0);
    })
    .catch(error => {
        console.error('❌ Razorpay Error:', {
            statusCode: error.statusCode,
            description: error.description,
            message: error.message
        });
        if (error.statusCode === 401) {
            console.error('\n💡 TIP: Your Secret Key is definitely incorrect or has extra characters (like spaces or quotes).');
        }
    });
