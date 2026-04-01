const axios = require('axios');

// 直接测试更新模型提供商，添加common_links
async function testUpdateProvider() {
  try {
    const providerId = '699d48ee-ab8c-442b-9348-aef5cdac89b0'; // 阿里云百炼CodingPlan的ID
    
    console.log('Testing with provider ID:', providerId);
    
    // 测试更新提供商，添加common_links
    const updateResponse = await axios.put(`http://localhost:3000/api/model-providers/${providerId}`, {
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
    }, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImIxZjBjZjBhLTk5NTEtNGE4Zi1hM2RlLWVkYjhiYjU0Mjg1NyIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlcyI6WyJhZG1pbiJdLCJpYXQiOjE3NzQ5NTY1NDQsImV4cCI6MTc3NTU2MTM0NH0.Lfc6ZQPduhg41O_b-QAHE4UsiVT6-sAbdNNuIwzbTxU'
      }
    });
    
    console.log('Update response:', updateResponse.data);
    
    // 检查更新后的提供商
    const updatedProvider = await axios.get(`http://localhost:3000/api/model-providers/${providerId}`, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImIxZjBjZjBhLTk5NTEtNGE4Zi1hM2RlLWVkYjhiYjU0Mjg1NyIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlcyI6WyJhZG1pbiJdLCJpYXQiOjE3NzQ5NTY1NDQsImV4cCI6MTc3NTU2MTM0NH0.Lfc6ZQPduhg41O_b-QAHE4UsiVT6-sAbdNNuIwzbTxU'
      }
    });
    
    console.log('Updated provider common_links:', updatedProvider.data.common_links);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testUpdateProvider();
