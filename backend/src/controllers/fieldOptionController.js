const pool = require('../config/database');

// 获取字段列表
const getFieldOptions = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    const conditions = [];
    const params = [];
    
    if (keyword) {
      conditions.push(`(fo.field_name ILIKE $${params.length + 1} OR fo.field_code ILIKE $${params.length + 1})`);
      params.push(`%${keyword}%`);
    }
    
    if (status) {
      conditions.push(`fo.status = $${params.length + 1}`);
      params.push(status);
    }
    
    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM field_options fo
      LEFT JOIN field_options pfo ON fo.parent_field_id = pfo.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    const queryParams = [...params, parseInt(pageSize), offset];
    const query = `
      SELECT 
        fo.*,
        pfo.field_name as parent_field_name
      FROM field_options fo
      LEFT JOIN field_options pfo ON fo.parent_field_id = pfo.id
      ${whereClause}
      ORDER BY fo.field_level ASC, fo.created_at DESC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: result.rows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Error getting field options:', error);
    res.status(500).json({ code: 500, message: '获取字段列表失败', data: null });
  }
};

// 获取字段详情
const getFieldOptionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        fo.*,
        pfo.field_name as parent_field_name
      FROM field_options fo
      LEFT JOIN field_options pfo ON fo.parent_field_id = pfo.id
      WHERE fo.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ code: 404, message: '字段不存在', data: null });
    }
    
    res.json({ code: 200, message: 'success', data: result.rows[0] });
  } catch (error) {
    console.error('Error getting field option:', error);
    res.status(500).json({ code: 500, message: '获取字段详情失败', data: null });
  }
};

// 创建字段
const createFieldOption = async (req, res) => {
  try {
    const { field_name, field_code, status = 'enabled', parent_field_id, field_level = 1, description } = req.body;
    
    if (!field_name || !field_code) {
      return res.status(400).json({ code: 400, message: '字段名称和字段标识必填', data: null });
    }
    
    const existingResult = await pool.query(
      'SELECT id FROM field_options WHERE field_name = $1 OR field_code = $2', 
      [field_name, field_code]
    );
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ code: 400, message: '字段名称或字段标识已存在', data: null });
    }
    
    let finalFieldLevel = field_level;
    if (parent_field_id) {
      const parentResult = await pool.query('SELECT field_level FROM field_options WHERE id = $1', [parent_field_id]);
      if (parentResult.rows.length > 0) {
        finalFieldLevel = parentResult.rows[0].field_level + 1;
      }
    }
    
    const result = await pool.query(`
      INSERT INTO field_options (field_name, field_code, status, parent_field_id, field_level, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [field_name, field_code, status, parent_field_id || null, finalFieldLevel, description]);
    
    res.json({ code: 200, message: '创建成功', data: result.rows[0] });
  } catch (error) {
    console.error('Error creating field option:', error);
    res.status(500).json({ code: 500, message: '创建字段失败', data: null });
  }
};

// 更新字段
const updateFieldOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { field_name, field_code, status, parent_field_id, field_level, description } = req.body;
    
    const existingResult = await pool.query('SELECT id FROM field_options WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ code: 404, message: '字段不存在', data: null });
    }
    
    if (field_name || field_code) {
      const checkResult = await pool.query(
        'SELECT id FROM field_options WHERE (field_name = $1 OR field_code = $2) AND id != $3', 
        [field_name, field_code, id]
      );
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ code: 400, message: '字段名称或字段标识已存在', data: null });
      }
    }
    
    let finalFieldLevel = field_level;
    if (parent_field_id && !field_level) {
      const parentResult = await pool.query('SELECT field_level FROM field_options WHERE id = $1', [parent_field_id]);
      if (parentResult.rows.length > 0) {
        finalFieldLevel = parentResult.rows[0].field_level + 1;
      }
    }
    
    const result = await pool.query(`
      UPDATE field_options 
      SET field_name = COALESCE($1, field_name),
          field_code = COALESCE($2, field_code),
          status = COALESCE($3, status),
          parent_field_id = $4,
          field_level = COALESCE($5, field_level),
          description = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [field_name, field_code, status, parent_field_id || null, finalFieldLevel, description, id]);
    
    res.json({ code: 200, message: '更新成功', data: result.rows[0] });
  } catch (error) {
    console.error('Error updating field option:', error);
    res.status(500).json({ code: 500, message: '更新字段失败', data: null });
  }
};

// 删除字段
const deleteFieldOption = async (req, res) => {
  try {
    const { id } = req.params;
    
    const childCheckResult = await pool.query('SELECT id FROM field_options WHERE parent_field_id = $1', [id]);
    if (childCheckResult.rows.length > 0) {
      return res.status(400).json({ code: 400, message: '存在子字段，无法删除', data: null });
    }
    
    await pool.query('DELETE FROM field_option_items WHERE field_id = $1', [id]);
    await pool.query('DELETE FROM field_options WHERE id = $1', [id]);
    
    res.json({ code: 200, message: '删除成功', data: null });
  } catch (error) {
    console.error('Error deleting field option:', error);
    res.status(500).json({ code: 500, message: '删除字段失败', data: null });
  }
};

// 切换字段状态
const toggleFieldStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['enabled', 'disabled', 'archived'].includes(status)) {
      return res.status(400).json({ code: 400, message: '状态值无效', data: null });
    }
    
    const result = await pool.query(`
      UPDATE field_options 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ code: 404, message: '字段不存在', data: null });
    }
    
    res.json({ code: 200, message: '状态更新成功', data: result.rows[0] });
  } catch (error) {
    console.error('Error toggling field status:', error);
    res.status(500).json({ code: 500, message: '更新字段状态失败', data: null });
  }
};

// 获取选项列表
const getFieldOptionItems = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { page = 1, pageSize = 100, keyword, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    const conditions = [`foi.field_id = $${1}`];
    const params = [fieldId];
    
    if (keyword) {
      conditions.push(`(foi.option_text ILIKE $${params.length + 1} OR foi.option_value ILIKE $${params.length + 1})`);
      params.push(`%${keyword}%`);
    }
    
    if (status) {
      conditions.push(`foi.status = $${params.length + 1}`);
      params.push(status);
    }
    
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM field_option_items foi
      LEFT JOIN field_option_items pfoi ON foi.parent_option_id = pfoi.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    const queryParams = [...params, parseInt(pageSize), offset];
    const query = `
      SELECT 
        foi.*,
        pfoi.option_text as parent_option_text
      FROM field_option_items foi
      LEFT JOIN field_option_items pfoi ON foi.parent_option_id = pfoi.id
      ${whereClause}
      ORDER BY foi.display_order ASC, foi.created_at ASC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: result.rows,
        total
      }
    });
  } catch (error) {
    console.error('Error getting field option items:', error);
    res.status(500).json({ code: 500, message: '获取选项列表失败', data: null });
  }
};

// 获取所有选项列表
const getAllOptionItems = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, field_id, keyword, field_keyword, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    const conditions = [];
    const params = [];
    
    if (field_id) {
      conditions.push(`foi.field_id = $${params.length + 1}`);
      params.push(field_id);
    }
    
    if (keyword) {
      conditions.push(`(fo.field_name ILIKE $${params.length + 1} OR fo.field_code ILIKE $${params.length + 1} OR foi.option_text ILIKE $${params.length + 1} OR foi.option_value ILIKE $${params.length + 1})`);
      params.push(`%${keyword}%`);
    }
    
    if (field_keyword) {
      conditions.push(`(fo.field_name ILIKE $${params.length + 1} OR fo.field_code ILIKE $${params.length + 1})`);
      params.push(`%${field_keyword}%`);
    }
    
    if (status) {
      conditions.push(`foi.status = $${params.length + 1}`);
      params.push(status);
    }
    
    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM field_option_items foi
      JOIN field_options fo ON foi.field_id = fo.id
      LEFT JOIN field_option_items pfoi ON foi.parent_option_id = pfoi.id
      LEFT JOIN field_options pfo ON fo.parent_field_id = pfo.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    const queryParams = [...params, parseInt(pageSize), offset];
    const query = `
      SELECT 
        foi.*,
        fo.field_name,
        fo.field_code,
        fo.status as field_status,
        fo.field_level,
        pfo.field_name as parent_field_name,
        pfoi.option_text as parent_option_text
      FROM field_option_items foi
      JOIN field_options fo ON foi.field_id = fo.id
      LEFT JOIN field_option_items pfoi ON foi.parent_option_id = pfoi.id
      LEFT JOIN field_options pfo ON fo.parent_field_id = pfo.id
      ${whereClause}
      ORDER BY fo.field_name ASC, foi.display_order ASC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: result.rows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Error getting all option items:', error);
    res.status(500).json({ code: 500, message: '获取选项列表失败', data: null });
  }
};

// 创建选项
const createFieldOptionItem = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { option_text, option_value, status = 'enabled', display_order = 0, parent_option_id } = req.body;
    
    if (!option_text || !option_value) {
      return res.status(400).json({ code: 400, message: '选项名称和选项Value必填', data: null });
    }
    
    const fieldCheckResult = await pool.query('SELECT id FROM field_options WHERE id = $1', [fieldId]);
    if (fieldCheckResult.rows.length === 0) {
      return res.status(404).json({ code: 404, message: '字段不存在', data: null });
    }
    
    const result = await pool.query(`
      INSERT INTO field_option_items (field_id, option_text, option_value, status, display_order, parent_option_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [fieldId, option_text, option_value, status, display_order, parent_option_id || null]);
    
    res.json({ code: 200, message: '创建成功', data: result.rows[0] });
  } catch (error) {
    console.error('Error creating field option item:', error);
    res.status(500).json({ code: 500, message: '创建选项失败', data: null });
  }
};

// 更新选项
const updateFieldOptionItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { option_text, option_value, status, display_order, parent_option_id } = req.body;
    
    const existingResult = await pool.query('SELECT id FROM field_option_items WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ code: 404, message: '选项不存在', data: null });
    }
    
    const result = await pool.query(`
      UPDATE field_option_items 
      SET option_text = COALESCE($1, option_text),
          option_value = COALESCE($2, option_value),
          status = COALESCE($3, status),
          display_order = COALESCE($4, display_order),
          parent_option_id = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [option_text, option_value, status, display_order, parent_option_id || null, id]);
    
    res.json({ code: 200, message: '更新成功', data: result.rows[0] });
  } catch (error) {
    console.error('Error updating field option item:', error);
    res.status(500).json({ code: 500, message: '更新选项失败', data: null });
  }
};

// 删除选项
const deleteFieldOptionItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const childCheckResult = await pool.query('SELECT id FROM field_option_items WHERE parent_option_id = $1', [id]);
    if (childCheckResult.rows.length > 0) {
      return res.status(400).json({ code: 400, message: '存在子选项，无法删除', data: null });
    }
    
    await pool.query('DELETE FROM field_option_items WHERE id = $1', [id]);
    
    res.json({ code: 200, message: '删除成功', data: null });
  } catch (error) {
    console.error('Error deleting field option item:', error);
    res.status(500).json({ code: 500, message: '删除选项失败', data: null });
  }
};

// 批量删除选项
const batchDeleteOptionItems = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ code: 400, message: '请选择要删除的选项', data: null });
    }
    
    await pool.query('DELETE FROM field_option_items WHERE id = ANY($1)', [ids]);
    
    res.json({ code: 200, message: '批量删除成功', data: null });
  } catch (error) {
    console.error('Error batch deleting option items:', error);
    res.status(500).json({ code: 500, message: '批量删除失败', data: null });
  }
};

// 切换选项状态
const toggleOptionItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['enabled', 'disabled', 'archived'].includes(status)) {
      return res.status(400).json({ code: 400, message: '状态值无效', data: null });
    }
    
    const result = await pool.query(`
      UPDATE field_option_items 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ code: 404, message: '选项不存在', data: null });
    }
    
    res.json({ code: 200, message: '状态更新成功', data: result.rows[0] });
  } catch (error) {
    console.error('Error toggling option item status:', error);
    res.status(500).json({ code: 500, message: '更新选项状态失败', data: null });
  }
};

// 刷新显示序号
const refreshOptionOrder = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { orders } = req.body;
    
    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ code: 400, message: '参数无效', data: null });
    }
    
    for (const item of orders) {
      await pool.query(`
        UPDATE field_option_items 
        SET display_order = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND field_id = $3
      `, [item.display_order, item.id, fieldId]);
    }
    
    res.json({ code: 200, message: '序号刷新成功', data: null });
  } catch (error) {
    console.error('Error refreshing option order:', error);
    res.status(500).json({ code: 500, message: '刷新序号失败', data: null });
  }
};

module.exports = {
  getFieldOptions,
  getFieldOptionById,
  createFieldOption,
  updateFieldOption,
  deleteFieldOption,
  toggleFieldStatus,
  getFieldOptionItems,
  getAllOptionItems,
  createFieldOptionItem,
  updateFieldOptionItem,
  deleteFieldOptionItem,
  batchDeleteOptionItems,
  toggleOptionItemStatus,
  refreshOptionOrder
};
