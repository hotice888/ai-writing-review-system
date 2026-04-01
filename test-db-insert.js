const pool = require('./backend/src/config/database');

// 直接向数据库插入common_links值
async function testDirectInsert() {
  try {
    const providerId = '699d48ee-ab8c-442b-9348-aef5cdac89b0'; // 阿里云百炼CodingPlan的ID
    
    console.log('Testing direct database update for common_links');
    
    // 直接更新数据库
    const result = await pool.query(
      `UPDATE model_providers 
       SET common_links = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      ['https://example.com/link1\nhttps://example.com/link2', providerId]
    );
    
    console.log('Direct update result:', result.rows[0]);
    
    // 检查更新后的值
    const checkResult = await pool.query(
      'SELECT id, name, common_links FROM model_providers WHERE id = $1',
      [providerId]
    );
    
    console.log('Updated common_links:', checkResult.rows[0].common_links);
    
    pool.end();
  } catch (error) {
    console.error('Error:', error);
    pool.end();
  }
}

testDirectInsert();
