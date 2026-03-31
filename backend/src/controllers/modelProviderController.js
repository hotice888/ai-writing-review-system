const pool = require('../config/database');

// 获取所有模型提供商
const getAllProviders = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM model_providers ORDER BY created_at DESC');
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows
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
    
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows[0]
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

// 创建模型提供商
const createProvider = async (req, res) => {
  try {
    const { name, code, url, openai_base_url, protocol_base_url, description, status } = req.body;
    
    // 检查code是否已存在
    const existingProvider = await pool.query('SELECT * FROM model_providers WHERE code = $1', [code]);
    if (existingProvider.rows.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '模型提供商编码已存在',
        data: null
      });
    }
    
    const result = await pool.query(
      `INSERT INTO model_providers (name, code, url, openai_base_url, protocol_base_url, description, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [name, code, url, openai_base_url, protocol_base_url, description, status || 'enabled']
    );
    
    res.status(201).json({
      code: 200,
      message: '模型提供商创建成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating model provider:', error);
    res.status(500).json({
      code: 500,
      message: '创建模型提供商失败',
      data: null
    });
  }
};

// 更新模型提供商
const updateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, url, openai_base_url, protocol_base_url, description, status } = req.body;
    
    // 检查模型提供商是否存在
    const existingProvider = await pool.query('SELECT * FROM model_providers WHERE id = $1', [id]);
    if (existingProvider.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '模型提供商不存在',
        data: null
      });
    }
    
    // 检查code是否与其他模型提供商重复
    if (code) {
      const codeCheck = await pool.query('SELECT * FROM model_providers WHERE code = $1 AND id != $2', [code, id]);
      if (codeCheck.rows.length > 0) {
        return res.status(400).json({
          code: 400,
          message: '模型提供商编码已存在',
          data: null
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE model_providers 
       SET name = $1, code = $2, url = $3, openai_base_url = $4, protocol_base_url = $5, description = $6, status = $7, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $8 
       RETURNING *`,
      [name, code, url, openai_base_url, protocol_base_url, description, status, id]
    );
    
    res.json({
      code: 200,
      message: '模型提供商更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating model provider:', error);
    res.status(500).json({
      code: 500,
      message: '更新模型提供商失败',
      data: null
    });
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