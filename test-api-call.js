const axios = require('axios');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 模拟前端API调用
async function testApiCall() {
  try {
    const providerId = '699d48ee-ab8c-442b-9348-aef5cdac89b0'; // 阿里云百炼CodingPlan的ID
    
    console.log('Testing API call with common_links');
    
    // 构建请求体，模拟前端的formData
    const formData = {
      name: '阿里云百炼CodingPlan',
      code: 'aliyun_bailian',
      url: 'https://bailian.console.aliyun.com/cn-beijing/?tab=coding-plan#/efm/coding-plan-index',
      openai_base_url: 'https://coding.dashscope.aliyuncs.com/v1',
      anthropic_base_url: 'https://coding.dashscope.aliyuncs.com/apps/anthropic',
      protocol_base_url: '',
      description: '默认仅支持CodingPlan提供的模型',
      status: 'enabled',
      common_links: 'https://example.com/link1\nhttps://example.com/link2',
      models: [
        { brand: '千问', modelId: 'qwen3.5-plus', capability: '文本生成、深度思考、视觉理解' },
        { brand: '千问', modelId: 'qwen3-max-2026-01-23', capability: '文本生成、深度思考' }
      ]
    };
    
    console.log('Request body:', formData);
    
    // 发送API请求
    const response = await axios.put(`http://localhost:3000/api/model-providers/${providerId}`, formData, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API response:', response.data);
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testApiCall();
