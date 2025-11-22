// DEBUG SCRIPT - Paste this into browser console on localhost:3000
// This will help debug the orders issue

console.clear();
console.log('🔍 RiceLink Orders Debug Script');
console.log('================================\n');

// Load orders from localStorage
const ordersRaw = localStorage.getItem('orders');
const orders = ordersRaw ? JSON.parse(ordersRaw) : [];

console.log(`📦 Total orders in localStorage: ${orders.length}`);
console.log('Orders:', orders);

// Expected shop names from database
const EXPECTED_SHOPS = [
  "Nhà máy sấy lúa SÁU THO",
  "Cơ sở sấy lúa Lệ Hoa",
  "Cơ sở sấy - Nhà máy Lộc Tấn",
  "Cơ sở sấy lúa Kim Oanh"
];

console.log('\n🏭 Expected Shop Names:');
EXPECTED_SHOPS.forEach((name, i) => {
  console.log(`  ${i + 1}. "${name}"`);
  console.log(`     Length: ${name.length}`);
  console.log(`     Char codes:`, Array.from(name).map(c => c.charCodeAt(0)));
});

console.log('\n📋 Orders Analysis:');
orders.forEach((order, i) => {
  const shopName = order.shopName || '';
  const matches = EXPECTED_SHOPS.includes(shopName);

  console.log(`\n  Order #${i + 1}: ${order.id.substring(0, 8)}...`);
  console.log(`    Client: ${order.clientName}`);
  console.log(`    Shop Name: "${shopName}"`);
  console.log(`    Shop Name Length: ${shopName.length}`);
  console.log(`    Char codes:`, Array.from(shopName).map(c => c.charCodeAt(0)));
  console.log(`    Status: ${order.status}`);
  console.log(`    Match: ${matches ? '✅ YES' : '❌ NO'}`);

  if (!matches && shopName) {
    console.log(`    🔍 Checking similarity...`);
    EXPECTED_SHOPS.forEach(expected => {
      if (expected.toLowerCase() === shopName.toLowerCase()) {
        console.log(`      ⚠️ Case-insensitive match: "${expected}"`);
      }
      if (expected.trim() === shopName.trim()) {
        console.log(`      ⚠️ Trim match: "${expected}"`);
      }
      // Check character by character
      if (expected.length === shopName.length) {
        let diffCount = 0;
        let diffs = [];
        for (let j = 0; j < expected.length; j++) {
          if (expected[j] !== shopName[j]) {
            diffCount++;
            diffs.push({
              pos: j,
              expected: expected[j],
              expectedCode: expected.charCodeAt(j),
              actual: shopName[j],
              actualCode: shopName.charCodeAt(j)
            });
          }
        }
        if (diffCount > 0 && diffCount < 5) {
          console.log(`      ⚠️ Almost matches "${expected}" - ${diffCount} char(s) different:`);
          diffs.forEach(d => {
            console.log(`        Position ${d.pos}: expected '${d.expected}' (${d.expectedCode}) but got '${d.actual}' (${d.actualCode})`);
          });
        }
      }
    });
  }
});

console.log('\n\n🔧 Quick Fixes:');
console.log('1. To clear all orders: localStorage.removeItem("orders")');
console.log('2. To view raw data: localStorage.getItem("orders")');
console.log('3. To manually set correct shop name for first order:');
console.log('   let orders = JSON.parse(localStorage.getItem("orders"));');
console.log('   orders[0].shopName = "Nhà máy sấy lúa SÁU THO";');
console.log('   localStorage.setItem("orders", JSON.stringify(orders));');
console.log('   location.reload();');

console.log('\n================================');
console.log('✅ Debug Complete');

