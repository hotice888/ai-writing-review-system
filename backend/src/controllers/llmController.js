const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const invokeLLM = async (req, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  
  console.log('=== invokeLLM called ===');
  console.log('Request body:', JSON.stringify(req.body));
  console.log('User:', req.user);
  
  try {
    const { id: user_id } = req.user;
    const { model_id, messages, business_type = 'test', params = {}, 
            api_url, api_key, model, openai_api_url, anthropic_api_url,
            session_id } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '消息内容不能为空',
        data: null
      });
    }
    
    // 如果没有传入session_id，自动生成一个
    const sessionId = session_id || uuidv4();
    console.log('使用的Session ID:', sessionId);
    let provider = 'custom';
    let apiUrl = anthropic_api_url || openai_api_url ;
    let apiKey = api_key;
    let modelName = model;
    
    // 如果有model_id，从数据库获取配置
    if (model_id) {
      const modelResult = await pool.query(
        'SELECT * FROM user_models WHERE id = $1 AND user_id = $2',
        [model_id, user_id]
      );
      
      if (modelResult.rows.length === 0) {
        return res.status(404).json({
          code: 404,
          message: '模型配置不存在或无权限访问',
          data: null
        });
      }
      
      const modelConfig = modelResult.rows[0];
      provider = 'custom';
      modelName = model;
      
      if (modelConfig.openai_api_url) {
        apiUrl = modelConfig.openai_api_url;
      } else if (modelConfig.anthropic_api_url) {
        apiUrl = modelConfig.anthropic_api_url;
      }
      
      apiKey = modelConfig.api_key;
    } else {
      // 测试模式：直接使用传入的参数
      if (!apiUrl) {
        return res.status(400).json({
          code: 400,
          message: 'API URL不能为空',
          data: null
        });
      }
      if (!apiKey) {
        return res.status(400).json({
          code: 400,
          message: 'API Key不能为空',
          data: null
        });
      }
      if (!modelName) {
        return res.status(400).json({
          code: 400,
          message: '模型标识不能为空',
          data: null
        });
      }
    }
    
    if (!apiUrl || !apiKey) {
      return res.status(400).json({
        code: 400,
        message: '模型配置不完整，缺少API URL或API Key',
        data: null
      });
    }
    
    if (!apiUrl.includes('/chat/completions') && !apiUrl.includes('/v1/')) {
      apiUrl = apiUrl.replace(/\/$/, '') + '/chat/completions';
    } else if (!apiUrl.includes('/chat/completions')) {
      apiUrl = apiUrl.replace('/v1', '/v1/chat/completions');
    }
    
    console.log('最终调用参数:');
    console.log('- Provider:', provider);
    console.log('- API URL:', apiUrl);
    console.log('- Model:', modelName);
    console.log('- Session ID:', session_id || '未提供');
    
    const requestParams = buildRequestParams(provider, modelName, messages, params);
    
    const response = await callLLMAPI(provider, apiUrl, apiKey, requestParams);
    const duration = Date.now() - startTime;
    
    // 从响应中提取 response_id（如果存在）
    const responseId = response.data?.id || null;
    
    // 记录日志，即使是测试模式
    await saveRequestLog({
      user_id,
      model_id: model_id || null,
      request_id: requestId,
      session_id: sessionId,
      response_id: responseId,
      business_type,
      request_url: apiUrl,
      request_method: 'POST',
      request_params: params,
      request_messages: messages,
      response_status_code: response.status,
      response_success: response.success,
      response_data: response.data,
      error_message: response.error,
      token_usage: response.tokenUsage,
      prompt_tokens: response.promptTokens,
      completion_tokens: response.completionTokens,
      total_tokens: response.totalTokens,
      duration_ms: duration
    });
    
    if (!response.success) {
      return res.status(response.status || 500).json({
        code: response.status || 500,
        message: response.error || 'API调用失败',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '调用成功',
      data: {
        request_id: requestId,
        session_id: sessionId,
        response_id: responseId,
        response: response.data,
        token_usage: response.tokenUsage,
        duration_ms: duration
      }
    });
    
  } catch (error) {
    console.error('Error invoking LLM:', error);
    const duration = Date.now() - startTime;
    
    // 确保 sessionId 在 catch 块中也可用
    const sessionId = req.body.session_id || uuidv4();
    
    if (req.user) {
      await saveRequestLog({
        user_id: req.user.id,
        model_id: req.body.model_id || null,
        request_id: requestId,
        session_id: sessionId,
        response_id: null,
        business_type: req.body.business_type || 'test',
        request_url: '',
        request_method: 'POST',
        request_params: req.body.params || {},
        request_messages: req.body.messages || [],
        response_status_code: 500,
        response_success: false,
        response_data: null,
        error_message: error.message,
        token_usage: null,
        prompt_tokens: null,
        completion_tokens: null,
        total_tokens: null,
        duration_ms: duration
      });
    }
    
    res.status(500).json({
      code: 500,
      message: '调用失败: ' + error.message,
      data: null
    });
  }
};

const buildRequestParams = (provider, model, messages, params) => {
  const baseParams = {
    model: model,
    messages: messages
  };
  
  switch (provider) {
    case 'openai':
      return {
        ...baseParams,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 2000,
        top_p: params.top_p || 1,
        frequency_penalty: params.frequency_penalty || 0,
        presence_penalty: params.presence_penalty || 0
      };
      
    case 'anthropic':
      return {
        model: model,
        messages: messages,
        max_tokens: params.max_tokens || 2000,
        temperature: params.temperature || 0.7,
        top_p: params.top_p || 1,
        top_k: params.top_k || 40
      };
      
    case 'zhipu':
      return {
        model: model,
        messages: messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 2000,
        top_p: params.top_p || 1
      };
      
    case 'aliyun':
    case 'custom':
      return {
        model: model,
        messages: messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 2000,
        top_p: params.top_p || 1
      };
      
    default:
      return {
        ...baseParams,
        ...params
      };
  }
};

const callLLMAPI = async (provider, apiUrl, apiKey, requestParams) => {
  try {
    let headers = {};
    let body = {};
    
    switch (provider) {
      case 'openai':
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };
        body = requestParams;
        break;
        
      case 'anthropic':
        headers = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        };
        body = requestParams;
        break;
        
      case 'zhipu':
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };
        body = requestParams;
        break;
        
      case 'aliyun':
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };
        body = requestParams;
        break;
        
      default:
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };
        body = requestParams;
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });
    
    const responseText = await response.text();
    console.log('LLM API Raw Response Status:', response.status);
    console.log('LLM API Raw Response:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Raw Response Text:', responseText);
      return {
        success: false,
        status: response.status,
        error: 'Failed to parse API response: ' + parseError.message,
        data: responseText
      };
    }
    
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: data.error?.message || data.message || 'API调用失败',
        data: data
      };
    }
    
    const tokenUsage = extractTokenUsage(provider, data);
    
    return {
      success: true,
      status: response.status,
      data: data,
      tokenUsage: tokenUsage,
      promptTokens: tokenUsage?.prompt_tokens,
      completionTokens: tokenUsage?.completion_tokens,
      totalTokens: tokenUsage?.total_tokens
    };
    
  } catch (error) {
    return {
      success: false,
      status: 500,
      error: error.message,
      data: null
    };
  }
};

const extractTokenUsage = (provider, responseData) => {
  switch (provider) {
    case 'openai':
      return responseData.usage ? {
        prompt_tokens: responseData.usage.prompt_tokens,
        completion_tokens: responseData.usage.completion_tokens,
        total_tokens: responseData.usage.total_tokens
      } : null;
      
    case 'anthropic':
      return responseData.usage ? {
        prompt_tokens: responseData.usage.input_tokens,
        completion_tokens: responseData.usage.output_tokens,
        total_tokens: (responseData.usage.input_tokens || 0) + (responseData.usage.output_tokens || 0)
      } : null;
      
    case 'zhipu':
      return responseData.usage ? {
        prompt_tokens: responseData.usage.prompt_tokens,
        completion_tokens: responseData.usage.completion_tokens,
        total_tokens: responseData.usage.total_tokens
      } : null;
      
    case 'aliyun':
      return responseData.usage ? {
        prompt_tokens: responseData.usage.input_tokens,
        completion_tokens: responseData.usage.output_tokens,
        total_tokens: (responseData.usage.input_tokens || 0) + (responseData.usage.output_tokens || 0)
      } : null;
      
    default:
      return responseData.usage || null;
  }
};

const saveRequestLog = async (logData) => {
  try {
    await pool.query(
      `INSERT INTO llm_request_records 
       (user_id, model_id, request_id, session_id, response_id, business_type, request_url, request_method, 
        request_params, request_messages, response_status_code, response_success, 
        response_data, error_message, token_usage, prompt_tokens, completion_tokens, 
        total_tokens, duration_ms, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())`,
      [logData.user_id, logData.model_id, logData.request_id, logData.session_id, logData.response_id, logData.business_type,
       logData.request_url, logData.request_method, JSON.stringify(logData.request_params),
       JSON.stringify(logData.request_messages), logData.response_status_code,
       logData.response_success, JSON.stringify(logData.response_data), logData.error_message,
       JSON.stringify(logData.token_usage), logData.prompt_tokens, logData.completion_tokens,
       logData.total_tokens, logData.duration_ms]
    );
  } catch (error) {
    console.error('Error saving request log:', error);
  }
};

module.exports = {
  invokeLLM
};
