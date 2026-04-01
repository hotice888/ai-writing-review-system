const pool = require('./src/config/database');
const aliyunConfig = require('./config/aliyun-models');

const addAliyunProvider = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('检查是否已存在阿里云百炼CodingPlan提供商...');
    
    const checkResult = await client.query(
      'SELECT id FROM model_providers WHERE code = $1',
      [aliyunConfig.provider.code]
    );
    
    if (checkResult.rows.length > 0) {
      console.log('阿里云百炼CodingPlan提供商已存在，跳过添加');
      await client.query('ROLLBACK');
      process.exit(0);
    }
    
    console.log('添加阿里云百炼CodingPlan提供商...');
    
    const result = await client.query(
      `INSERT INTO model_providers 
       (name, code, url, openai_base_url, anthropic_base_url, protocol_base_url, description, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id`,
      [
        aliyunConfig.provider.name,
        aliyunConfig.provider.code,
        aliyunConfig.provider.url,
        aliyunConfig.provider.openai_base_url,
        aliyunConfig.provider.anthropic_base_url,
        aliyunConfig.provider.protocol_base_url,
        aliyunConfig.provider.description,
        aliyunConfig.provider.status
      ]
    );
    
    const providerId = result.rows[0].id;
    
    // 添加模型数据
    console.log('添加模型数据...');
    for (const model of aliyunConfig.models) {
      await client.query(
        `INSERT INTO model_provider_models (provider_id, name, model_code, memo) 
         VALUES ($1, $2, $3, $4)`,
        [providerId, model.brand, model.modelId, model.capability]
      );
    }
    
    await client.query('COMMIT');
    
    console.log('阿里云百炼CodingPlan提供商添加成功！ID:', providerId);
    
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('添加阿里云百炼CodingPlan提供商失败:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

addAliyunProvider();
