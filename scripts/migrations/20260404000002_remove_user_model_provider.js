const pool = require('../../backend/src/config/database');

const runMigration = async () => {
  console.log('========================================');
  console.log('开始删除 user_models 表的 provider 字段');
  console.log('========================================\n');

  const client = await pool.connect();
  
  try {
    console.log('1. 检查 provider 字段是否存在...');
    const checkProvider = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_models' 
      AND column_name = 'provider'
    `);
    
    if (checkProvider.rows.length === 0) {
      console.log('✓ provider 字段不存在，无需删除\n');
    } else {
      console.log('✓ provider 字段存在\n');
      
      console.log('2. 删除 provider 字段...');
      await client.query(`
        ALTER TABLE user_models 
        DROP COLUMN provider
      `);
      console.log('✓ 已删除 provider 字段\n');
    }
    
    console.log('========================================');
    console.log('迁移完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('========================================');
    console.error('迁移失败！');
    console.error('错误详情:', error);
    console.error('========================================');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

runMigration().catch(error => {
  console.error('执行迁移脚本失败:', error);
  process.exit(1);
});
