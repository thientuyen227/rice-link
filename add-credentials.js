const fs = require('fs');

const filePath = 'src/data/shop.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Danh sách username cho các shop còn lại (STT 3-20)
const credentials = [
  { stt: 3, username: 'loctan', password: '123456' },
  { stt: 4, username: 'kimoanh', password: '123456' },
  { stt: 5, username: 'quocdanh', password: '123456' },
  { stt: 6, username: 'thanhnghiep', password: '123456' },
  { stt: 7, username: 'trunghau', password: '123456' },
  { stt: 8, username: 'hanhphuoc', password: '123456' },
  { stt: 9, username: 'thaibinh', password: '123456' },
  { stt: 10, username: 'huunghia', password: '123456' },
  { stt: 11, username: 'hiepphat', password: '123456' },
  { stt: 12, username: 'namhai3', password: '123456' },
  { stt: 13, username: 'baythien', password: '123456' },
  { stt: 14, username: 'doanket2', password: '123456' },
  { stt: 15, username: 'dongtam', password: '123456' },
  { stt: 16, username: 'dungkieu', password: '123456' },
  { stt: 17, username: 'quocdat', password: '123456' },
  { stt: 18, username: 'thuylinh', password: '123456' },
  { stt: 19, username: 'thanhthang', password: '123456' },
  { stt: 20, username: 'utphong', password: '123456' },
];

credentials.forEach(({ stt, username, password }) => {
  const pattern = new RegExp(
    `(STT: ${stt},[\\s\\S]*?"Giá sấy và bảo quản lúa": \\d+,)\\n(\\s*)(})`,
    'g'
  );

  content = content.replace(
    pattern,
    `$1\n$2username: "${username}",\n$2password: "${password}",\n$2}`
  );
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Added username/password to all shops!');

