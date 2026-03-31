const pool = require('../config/database');

// 获取所有模型
const getAllModels = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM models ORDER BY created_at DESC');
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting models:', error);
    res.status(500).json({
      code: 500,
      message: '获取模型列表失败',
      data: null
    });
  }
};

// 获取单个模型
const getModelById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM models WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '模型不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting model:', error);
    res.status(500).json({
      code: 500,
      message: '获取模型失败',
      data: null
    });
  }
};

// 创建模型
const createModel = async (req, res) => {
  try {
    const { name, code, provider, model, description, status } = req.body;
    
    // 检查code是否已存在
    const existingModel = await pool.query('SELECT * FROM models WHERE code = $1', [code]);
    if (existingModel.rows.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '模型编码已存在',
        data: null
      });
    }
    
    const result = await pool.query(
      `INSERT INTO models (name, code, provider, model, description, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, code, provider, model, description, status || 'enabled']
    );
    
    res.status(201).json({
      code: 200,
      message: '模型创建成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating model:', error);
    res.status(500).json({
      code: 500,
      message: '创建模型失败',
      data: null
    });
  }
};

// 更新模型
const updateModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, provider, model, description, status } = req.body;
    
    // 检查模型是否存在
    const existingModel = await pool.query('SELECT * FROM models WHERE id = $1', [id]);
    if (existingModel.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '模型不存在',
        data: null
      });
    }
    
    // 检查code是否与其他模型重复
    if (code) {
      const codeCheck = await pool.query('SELECT * FROM models WHERE code = $1 AND id != $2', [code, id]);
      if (codeCheck.rows.length > 0) {
        return res.status(400).json({
          code: 400,
          message: '模型编码已存在',
          data: null
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE models 
       SET name = $1, code = $2, provider = $3, model = $4, description = $5, status = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 
       RETURNING *`,
      [name, code, provider, model, description, status, id]
    );
    
    res.json({
      code: 200,
      message: '模型更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating model:', error);
    res.status(500).json({
      code: 500,
      message: '更新模型失败',
      data: null
    });
  }
};

// 删除模型
const deleteModel = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查模型是否存在
    const existingModel = await pool.query('SELECT * FROM models WHERE id = $1', [id]);
    if (existingModel.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '模型不存在',
        data: null
      });
    }
    
    await pool.query('DELETE FROM models WHERE id = $1', [id]);
    
    res.json({
      code: 200,
      message: '模型删除成功',
      data: null
    });
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({
      code: 500,
      message: '删除模型失败',
      data: null
    });
  }
};

module.exports = {
  getAllModels,
  getModelById,
  createModel,
  updateModel,
  deleteModel
};