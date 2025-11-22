// Test script để kiểm tra localStorage orders
// Chạy trong browser console

console.log('=== CHECKING ORDERS IN LOCALSTORAGE ===');

// 1. Lấy raw data
const rawOrders = localStorage.getItem('orders');
console.log('Raw orders data:', rawOrders);

// 2. Parse data
if (rawOrders) {
  try {
    const orders = JSON.parse(rawOrders);
    console.log('Total orders:', orders.length);
    console.log('All orders:', orders);

    // 3. Kiểm tra shopName của từng order
    orders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`, {
        id: order.id,
        clientName: order.clientName,
        shopName: order.shopName,
        createdAt: new Date(order.createdAt).toLocaleString('vi-VN')
      });
    });

    // 4. Lấy danh sách unique shop names
    const shopNames = [...new Set(orders.map(o => o.shopName))];
    console.log('Unique shop names:', shopNames);

    // 5. Đếm số đơn hàng theo shop
    const ordersByShop = {};
    orders.forEach(order => {
      const shop = order.shopName || 'No Shop';
      ordersByShop[shop] = (ordersByShop[shop] || 0) + 1;
    });
    console.log('Orders by shop:', ordersByShop);

  } catch (error) {
    console.error('Error parsing orders:', error);
  }
} else {
  console.log('No orders found in localStorage');
}

console.log('=== CHECK COMPLETED ===');

