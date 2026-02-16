const dns = require('dns');

console.log('Resolving host IPv4...');
dns.resolve4('db.prvhnlamrknodwxuswyv.supabase.co', (err, addresses) => {
    if (err) {
        console.error('DNS Resolution failed:', err);
        return;
    }
    console.log('IPv4 Addresses:', addresses);
    if (addresses.length > 0) {
        console.log('Trying connection to first IP:', addresses[0]);
        // Here I would try connecting to this IP
    }
});
