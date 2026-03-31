
阿里云百炼:
Base URL 获取：https://bailian.console.aliyun.com/cn-beijing/?tab=coding-plan#/efm/coding-plan-index
OpenAI：https://coding.dashscope.aliyuncs.com/v1
Anthropic：https://coding.dashscope.aliyuncs.com/apps/anthropic
API KEY 获取
使用开发文档： 
说明
硅基流动
OpenAI  https://api.siliconflow.cn/v1  model="openai/gpt-4o"
Anthropic https://api.siliconflow.cn/v1  model="anthropic/claude-3.5-sonnet"
API KEY 获取：https://cloud.siliconflow.cn/me/account/ak
```Python
# 通过硅基流动或OpenRouter等聚合平台，统一调用两种接口

import openai

# 配置硅基流动的聚合API
client = openai.OpenAI(
    base_url="https://api.siliconflow.cn/v1",  # 统一入口
    api_key="your-api-key"
)

# 阶段1：用Claude生成正文（保持一致性）
response = client.chat.completions.create(
    model="anthropic/claude-3.5-sonnet",  # 指定Claude模型
    messages=[
        {"role": "system", "content": "你是玄幻小说作家，保持人物性格一致性"},
        {"role": "user", "content": "续写第15章，主角林尘进入遗迹后..."}
    ]
)
chapter_draft = response.choices[0].message.content

# 阶段2：用GPT优化网感（可选）
response2 = client.chat.completions.create(
    model="openai/gpt-4o",  # 切换GPT模型
    messages=[
        {"role": "system", "content": "增强爽点密度，加入网文流行语感"},
        {"role": "user", "content": f"优化以下段落：{chapter_draft}"}
    ]
)
final_chapter = response2.choices[0].message.content
```

## 硅基流动Anthropic

### request POST

```TypeScript
curl --request POST 
--url https://api.siliconflow.cn/v1/messages 
-H "Content-Type: application/json" 
-H "Authorization: Bearer YOUR_API_KEY" 
-d '{
"model": "Pro/zai-org/GLM-4.7",
"messages": [
{"role": "system", "content": "你是一个有用的助手"},
{"role": "user", "content": "你好，请介绍一下你自己"}
]
}'
```

### Response

```JSON
{
"content": [
{
"type": "thinking",
"thinking": "...",
"signature": "tvshsltrjs"
},
{
"text": "Hello! I'm GLM, trained by Z.ai. How can I assist you today? Whether you have questions or just want to chat, I'm happy to help.",
"type": "text"
}
],
"id": "msg_T15jjp718fACotrwiLp3KwVu",
"model": "Pro/zai-org/GLM-4.7",
"role": "assistant",
"stop_reason": "end_turn",
"stop_sequence": null,
"type": "message",
"usage": {
"input_tokens": 6,
"output_tokens": 215
}
}
```

## 硅基流动OpenAI

### request POST

```TypeScript
curl --request POST \
  --url https://api.siliconflow.cn/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "Pro/zai-org/GLM-4.7",
    "messages": [
      {"role": "system", "content": "你是一个有用的助手"},
      {"role": "user", "content": "你好，请介绍一下你自己"}
    ]
  }
```

### Response

```
{
"id": "019bdaa55225ef854b320e9b838f77ce",
"object": "chat.completion",
"created": 1768899826,
"model": "Pro/zai-org/GLM-4.7",
"choices": [
{
"index": 0,
"message": {
"role": "assistant",
"content": "你好！...",
"reasoning_content": "..."
},
"finish_reason": "stop"
}
],
"usage": {
"prompt_tokens": 15,
"completion_tokens": 1540,
"total_tokens": 1555,
"completion_tokens_details": {
"reasoning_tokens": 1190
},
"prompt_tokens_details": {
"cached_tokens": 0
},
"prompt_cache_hit_tokens": 0,
"prompt_cache_miss_tokens": 15
},
"system_fingerprint": ""
}
```

