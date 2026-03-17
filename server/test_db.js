const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function test() {
    console.log('--- Supabase Integrity Test ---');

    // 1. Check Tables
    const { data: portals, error: pError } = await supabase.from('portals').select('count', { count: 'exact' });
    if (pError) console.error('Portals Table Error:', pError);
    else console.log('Portals Count:', portals);

    // 2. Test OR query with complex strings
    const testDeviceId = 'DEV-TEST-123';
    const testIp = '::1';

    console.log('\nTesting .or() query with quotes:');
    const { data: d1, error: e1 } = await supabase.from('portals')
        .select('*')
        .or(`device_id.eq."${testDeviceId}",ip_address.eq."${testIp}"`);
    if (e1) console.error('Query 1 Error:', e1);
    else console.log('Query 1 Result size:', d1.length);

    console.log('\nTesting .or() query without quotes:');
    const { data: d2, error: e2 } = await supabase.from('portals')
        .select('*')
        .or(`device_id.eq.${testDeviceId},ip_address.eq.${testIp}`);
    if (e2) console.error('Query 2 Error:', e2);
    else console.log('Query 2 Result size:', d2.length);

    // 4. Test INSERT
    console.log('\nTesting INSERT...');
    const { data: iData, error: iError } = await supabase.from('portals').insert([{
        code: 'XYZ',
        expires_at: new Date(Date.now() + 60000).toISOString(),
        ip_address: '127.0.0.1',
        device_id: 'TEST-INSERT'
    }]).select();

    if (iError) console.error('Insert Error:', iError);
    else console.log('Insert Success:', iData);
}

test();
