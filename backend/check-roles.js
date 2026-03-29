const { Pool } = require('pg');
require('dotenv').config();

// 使用.env文件中的数据库连接参数
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ai_writing_review',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function checkRoles() {
  try {
    console.log('正在检查数据库中的角色数据...');
    
    // 连接数据库
    const client = await pool.connect();
    
    // 查询角色表
    const result = await client.query('SELECT * FROM roles ORDER BY created_at ASC');
    
    console.log('角色数量:', result.rows.length);
    console.log('角色数据:');
    result.rows.forEach((role, index) => {
      console.log(`${index + 1}. ID: ${role.id}`);
      console.log(`   名称: ${role.name}`);
      console.log(`   代码: ${role.code}`);
      console.log(`   描述: ${role.description}`);
      console.log(`   状态: ${role.status}`);
      console.log(`   创建时间: ${role.created_at}`);
      console.log('---');
    });
    
    // 关闭连接
    client.release();
    
  } catch (error) {
    console.error('检查角色数据错误:', error);
  } finally {
    // 关闭池
    await pool.end();
  }
}

checkRoles();
