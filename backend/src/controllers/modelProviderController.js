const pool = require('../config/database');

// 辅助函数：获取提供商的模型列表
const getProviderModels = async (providerId) => {
  const result = await pool.query(
    'SELECT * FROM model_provider_models WHERE provider_id = $1 ORDER BY created_at',
    [providerId]
  );
  return result.rows.map(row => ({
    brand: row.name,
    modelId: row.model_code,
    capability: row.memo
  }));
};

// 获取所有模型提供商（使用JOIN查询优化性能，避免N+1问题）
const getAllProviders = async (req, res) => {
  try {
    // 使用LEFT JOIN一次性获取所有提供商及其模型
    const result = await pool.query(`
      SELECT 
        p.*, 
        m.id as model_id, 
        m.name as model_name, 
        m.model_code, 
        m.memo, 
        m.created_at as model_created_at
      FROM model_providers p
      LEFT JOIN model_provider_models m ON p.id = m.provider_id
      ORDER BY p.updated_at DESC, m.created_at
    `);
    
    // 按提供商分组
    const providersMap = new Map();
    
    result.rows.forEach(row => {
      const providerId = row.id;
      
      if (!providersMap.has(providerId)) {
        // 创建新的提供商对象
        providersMap.set(providerId, {
          ...row,
          models: []
        });
        // 移除模型相关字段
        delete providersMap.get(providerId).model_id;
        delete providersMap.get(providerId).model_name;
        delete providersMap.get(providerId).model_code;
        delete providersMap.get(providerId).memo;
        delete providersMap.get(providerId).model_created_at;
      }
      
      // 如果有模型数据，添加到模型列表
      if (row.model_id) {
        providersMap.get(providerId).models.push({
          brand: row.model_name,
          modelId: row.model_code,
          capability: row.memo
        });
      }
    });
    
    // 转换为数组
    const providersWithModels = Array.from(providersMap.values());
    
    res.json({
      code: 200,
      message: '获取成功',
      data: providersWithModels
    });
  } catch (error) {
    console.error('Error getting model providers:', error);
    res.status(500).json({
      code: 500,
      message: '获取模型提供商列表失败',
      data: null
    });
  }
};

// 获取单个模型提供商
const getProviderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM model_providers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '模型提供商不存在',
        data: null
      });
    }
    
    const provider = result.rows[0];
    const models = await getProviderModels(id);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: { ...provider, models }
    });
  } catch (error) {
    console.error('Error getting model provider:', error);
    res.status(500).json({
      code: 500,
      message: '获取模型提供商失败',
      data: null
    });
  }
};

// 辅助函数：创建模型列表
const createProviderModels = async (providerId, models, client = pool) => {
  if (!models || models.length === 0) {
    return;
  }
  
  for (const model of models) {
    await client.query(
      `INSERT INTO model_provider_models (provider_id, name, model_code, memo) 
       VALUES ($1, $2, $3, $4)`,
      [providerId, model.brand, model.modelId, model.capability]
    );
  }
};

// 辅助函数：更新模型列表（先删除后创建）
const updateProviderModels = async (providerId, models, client = pool) => {
  await client.query('DELETE FROM model_provider_models WHERE provider_id = $1', [providerId]);
  await createProviderModels(providerId, models, client);
};

// 创建模型提供商
const createProvider = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { name, code, url, openai_base_url, anthropic_base_url, protocol_base_url, description, status, common_links, models } = req.body;
    
    // 检查code是否已存在
    const existingProvider = await client.query('SELECT * FROM model_providers WHERE code = $1', [code]);
    if (existingProvider.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        code: 400,
        message: '模型提供商编码已存在',
        data: null
      });
    }
    
    const result = await client.query(
      `INSERT INTO model_providers (name, code, url, openai_base_url, anthropic_base_url, protocol_base_url, description, status, common_links) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [name, code, url, openai_base_url, anthropic_base_url, protocol_base_url, description, status || 'enabled', common_links]
    );
    
    const newProvider = result.rows[0];
    
    // 创建模型列表
    await createProviderModels(newProvider.id, models, client);
    
    await client.query('COMMIT');
    
    // 获取完整的提供商数据（包含模型）
    const providerWithModels = {
      ...newProvider,
      models: await getProviderModels(newProvider.id)
    };
    
    res.status(201).json({
      code: 200,
      message: '模型提供商创建成功',
      data: providerWithModels
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating model provider:', error);
    res.status(500).json({
      code: 500,
      message: '创建模型提供商失败',
      data: null
    });
  } finally {
    client.release();
  }
};

// 更新模型提供商
const updateProvider = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { name, code, url, openai_base_url, anthropic_base_url, protocol_base_url, description, status, common_links, models } = req.body;
    
    // 检查模型提供商是否存在
    const existingProvider = await client.query('SELECT * FROM model_providers WHERE id = $1', [id]);
    if (existingProvider.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        code: 404,
        message: '模型提供商不存在',
        data: null
      });
    }
    
    // 检查code是否与其他模型提供商重复
    if (code) {
      const codeCheck = await client.query('SELECT * FROM model_providers WHERE code = $1 AND id != $2', [code, id]);
      if (codeCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          code: 400,
          message: '模型提供商编码已存在',
          data: null
        });
      }
    }
    
    const result = await client.query(
      `UPDATE model_providers 
       SET name = $1, code = $2, url = $3, openai_base_url = $4, anthropic_base_url = $5, protocol_base_url = $6, description = $7, status = $8, common_links = $9, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $10 
       RETURNING *`,
      [name, code, url, openai_base_url, anthropic_base_url, protocol_base_url, description, status, common_links, id]
    );
    
    const updatedProvider = result.rows[0];
    
    // 更新模型列表（使用事务连接）
    await updateProviderModels(updatedProvider.id, models, client);
    
    await client.query('COMMIT');
    
    // 获取完整的提供商数据（包含模型）
    const providerWithModels = {
      ...updatedProvider,
      models: await getProviderModels(updatedProvider.id)
    };
    
    res.json({
      code: 200,
      message: '模型提供商更新成功',
      data: providerWithModels
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating model provider:', error);
    res.status(500).json({
      code: 500,
      message: '更新模型提供商失败',
      data: null
    });
  } finally {
    client.release();
  }
};

// 删除模型提供商
const deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查模型提供商是否存在
    const existingProvider = await pool.query('SELECT * FROM model_providers WHERE id = $1', [id]);
    if (existingProvider.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '模型提供商不存在',
        data: null
      });
    }
    
    // 模型会通过ON DELETE CASCADE自动删除
    await pool.query('DELETE FROM model_providers WHERE id = $1', [id]);
    
    res.json({
      code: 200,
      message: '模型提供商删除成功',
      data: null
    });
  } catch (error) {
    console.error('Error deleting model provider:', error);
    res.status(500).json({
      code: 500,
      message: '删除模型提供商失败',
      data: null
    });
  }
};

module.exports = {
  getAllProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider
};
