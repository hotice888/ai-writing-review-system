const bcrypt = require('bcryptjs');
const pool = require('./src/config/database');

const createAdminUser = async () => {
  try {
    const username = 'admin';
    const email = 'admin@example.com';
    const password = '123456';
    const role = 'admin';

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, role]
    );

    console.log('超级管理员账号创建成功:', result.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error('创建超级管理员账号失败:', error);
    process.exit(1);
  }
};

createAdminUser();
