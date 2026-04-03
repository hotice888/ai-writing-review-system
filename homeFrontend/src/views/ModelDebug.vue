<template>
  <div class="model-debug-container">
    <!-- 左侧会话列表 -->
    <div class="session-list">
      <div class="session-header">
        <el-button type="primary" @click="startNewSession" :icon="getIcon('Plus')">发起新会话</el-button>
      </div>
      <div class="session-list-content">
        <div 
          v-for="session in sessionList" 
          :key="session.id"
          class="session-item"
          :class="{ active: currentSessionId === session.id }"
          @click="switchSession(session.id)"
        >
          <div class="session-title">{{ session.title }}</div>
          <div class="session-time">{{ formatDateTime(session.updated_at) }}</div>
        </div>
      </div>
    </div>

    <!-- 右侧对话内容 -->
    <div class="chat-content">
      <!-- 会话标题 -->
      <div class="chat-header">
        <h2>{{ currentSession?.title || '未选择会话' }}</h2>
      </div>

      <!-- 对话消息列表 -->
      <div class="message-list" ref="messageListRef">
        <div 
          v-for="(message, index) in currentSessionMessages" 
          :key="index"
          class="message-item"
          :class="message.role === 'user' ? 'user-message' : 'assistant-message'"
        >
          <!-- 思考内容 -->
          <div v-if="message.role === 'assistant' && message.thinking" class="thinking-content">
            <el-tag size="small" type="info">已思考 (用时 {{ message.thinking_time || 0 }} 秒)</el-tag>
            <div class="thinking-text">{{ message.thinking }}</div>
          </div>
          <!-- 消息内容 -->
          <div class="message-text">{{ message.content }}</div>
        </div>
        <!-- 状态提示 -->
        <div v-if="statusMessage" class="status-message" :class="statusType">
          {{ statusMessage }}
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <!-- 输入框 -->
        <div class="chat-input-container">
          <!-- 第一行：输入框 -->
          <div class="chat-input-row">
            <el-input
              v-model="inputMessage"
              type="textarea"
              placeholder="给模型发送消息..."
              :rows="3"
              resize="none"
              @keyup.enter.exact="sendMessage"
              class="chat-textarea"
              @focus="isInputFocused = true"
              @blur="isInputFocused = false"
            />
          </div>
          <!-- 第二行：按钮 -->
          <div class="chat-buttons-row">
            <div class="buttons-left">
              <div class="input-buttons">
                <el-button size="small" @click="handleAtImage" :icon="getIcon('Avatar')" circle />
                <el-button size="small" @click="handleSmartSearch" :icon="getIcon('Light')" circle />
                <el-button size="small" @click="handleOptimize" class="optimize-button">
                  <el-icon :is="getIcon('MagicStick')"></el-icon>
                  一键优化
                </el-button>
                <el-switch v-model="enableThinking" active-text="深度思考" inactive-text="" style="margin-left: 10px;" />
                <div class="model-select-container">
                  <el-select v-model="selectedModelId" placeholder="选择模型" style="width: 150px;">
                    <el-option 
                      v-for="model in availableModels" 
                      :key="model.id"
                      :label="model.name"
                      :value="model.id"
                    />
                  </el-select>
                </div>
              </div>
            </div>
            <div class="buttons-right">
              <el-button 
                type="primary" 
                @click="sendMessage" 
                :icon="getIcon('ArrowUp')"
                :disabled="!inputMessage.trim()"
                class="send-button"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

// 安全地获取图标，不存在时返回默认图标
const getIcon = (name) => {
  return ElementPlusIconsVue[name] || ElementPlusIconsVue.Document;
};

import { getUserModels, testModel as testModelApi } from '../api/userModels';

// 响应式数据
const sessionList = ref([]);
const currentSessionId = ref('');
const currentSession = ref(null);
const currentSessionMessages = ref([]);
const inputMessage = ref('');
const selectedModelId = ref('');
const availableModels = ref([]);
const enableThinking = ref(false);
const statusMessage = ref('');
const statusType = ref('');
const messageListRef = ref(null);
const isInputFocused = ref(false);

// 加载用户模型
const loadUserModels = async () => {
  try {
    const models = await getUserModels();
    availableModels.value = models;
    if (models.length > 0 && !selectedModelId.value) {
      selectedModelId.value = models[0].id;
    }
  } catch (error) {
    console.error('加载用户模型失败:', error);
  }
};

// 加载会话列表
const loadSessions = async () => {
  // 模拟数据，实际应从后端API获取
  sessionList.value = [
    {
      id: '1',
      title: '用户问模型助手回应',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      title: '历史更老智能体对话',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];
  if (sessionList.value.length > 0 && !currentSessionId.value) {
    currentSessionId.value = sessionList.value[0].id;
    switchSession(sessionList.value[0].id);
  }
};

// 发起新会话
const startNewSession = () => {
  const newSession = {
    id: Date.now().toString(),
    title: '新会话',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  sessionList.value.unshift(newSession);
  currentSessionId.value = newSession.id;
  switchSession(newSession.id);
};

// 切换会话
const switchSession = (sessionId) => {
  currentSessionId.value = sessionId;
  currentSession.value = sessionList.value.find(s => s.id === sessionId);
  // 模拟数据，实际应从后端API获取
  currentSessionMessages.value = [
    {
      role: 'user',
      content: '你好'
    },
    {
      role: 'assistant',
      content: '你好！很高兴见到你，有什么我可以帮你的吗？',
      thinking: '用户发了一个简单的问候"你好"，这是一个非常基础的开场问候，没有复杂的问题或深层需求。用户可能只是想打个招呼，测试一下回应，或者稍后提问题。我需要用友好、热情的方式回应，同时保持简洁明了。可以用中文"你好"直接回复，加上一个表情符号让语气更亲切。最后可以主动提供帮助，引导用户说出具体需求。',
      thinking_time: 2
    }
  ];
  // 滚动到底部
  scrollToBottom();
};

// 发送消息
const sendMessage = async () => {
  const message = inputMessage.value.trim();
  if (!message) return;
  if (!selectedModelId.value) {
    ElMessage.warning('请选择一个模型');
    return;
  }

  // 添加用户消息
  const userMessage = {
    role: 'user',
    content: message
  };
  currentSessionMessages.value.push(userMessage);
  inputMessage.value = '';
  scrollToBottom();

  // 显示发送中状态
  statusMessage.value = '发送中...';
  statusType.value = 'info';

  try {
    // 调用模型API
    const result = await testModelApi({
      model_id: selectedModelId.value,
      messages: currentSessionMessages.value.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      business_type: 'debug',
      params: {
        max_tokens: 500,
        temperature: 0.7
      }
    });

    // 清除状态消息
    statusMessage.value = '';

    // 添加助手回复
    if (result.response) {
      const content = result.response.choices?.[0]?.message?.content || result.response.content || result.response.text;
      const assistantMessage = {
        role: 'assistant',
        content: content,
        thinking: enableThinking.value ? '这里是思考内容...' : null,
        thinking_time: 2
      };
      currentSessionMessages.value.push(assistantMessage);
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    statusMessage.value = '发送失败，请重试';
    statusType.value = 'error';
    // 添加错误消息
    const errorMessage = {
      role: 'assistant',
      content: `错误: ${error.message || '未知错误'}`
    };
    currentSessionMessages.value.push(errorMessage);
  } finally {
    scrollToBottom();
  }
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    }
  });
};

// 处理深度思考
const handleDeepThinking = () => {
  enableThinking.value = !enableThinking.value;
};

// 处理智能搜索
const handleSmartSearch = () => {
  // 功能待实现
  ElMessage.info('智能搜索功能暂未实现');
};

// 处理上传附件
const handleUploadFile = () => {
  // 功能待实现
  ElMessage.info('上传附件功能暂未实现');
};

// 处理上传图片
const handleUploadImage = () => {
  // 功能待实现
  ElMessage.info('上传图片功能暂未实现');
};

// 处理@图片
const handleAtImage = () => {
  // 功能待实现
  ElMessage.info('@图片功能暂未实现');
};

// 处理一键优化
const handleOptimize = () => {
  // 功能待实现
  ElMessage.info('一键优化功能暂未实现');
};

// 格式化时间
const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 监听消息变化，自动滚动到底部
watch(currentSessionMessages, () => {
  scrollToBottom();
}, { deep: true });

// 生命周期钩子
onMounted(() => {
  loadUserModels();
  loadSessions();
});
</script>

<style scoped>
.model-debug-container {
  display: flex;
  height: 100%;
  background-color: #f5f7fa;
  overflow: hidden;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 左侧会话列表 */
.session-list {
  width: 300px;
  border-right: 1px solid #e4e7ed;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.session-header {
  padding: 10px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0px;
}

.session-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

.session-item {
  padding: 2px;
  margin-bottom: 2px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e4e7ed;
}

.session-item:hover {
  background-color: #f5f7fa;
}

.session-item.active {
  background-color: #ecf5ff;
  border-color: #409eff;
}

.session-title {
  font-size: 14px;
  font-weight: 400;
  margin-bottom: 0px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-time {
  font-size: 10px;
  color: #909399;
}

/* 右侧对话内容 */
.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  overflow: hidden;
  height: 100%;
  box-sizing: border-box;
}

.chat-header {
  padding: 10px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafafa;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px 0;
}

.chat-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 5px;
  display: flex;
  flex-direction: column;
  gap: 0;
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

.message-item {
  max-width: 80%;
  padding: 6px 8px;
  border-radius: 8px;
  line-height: 1.5;
}

.user-message {
  align-self: flex-end;
  background-color: #ecf5ff;
  border: 1px solid #d9ecff;
  color: #303133;
}

.assistant-message {
  align-self: flex-start;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  color: #303133;
}

.thinking-content {
  margin-bottom: 2px;
  padding: 4px;
  background-color: #f0f9ff;
  border-radius: 6px;
  font-size: 14px;
}

.thinking-text {
  margin-top: 5px;
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
}
.message-text {
  font-size: 12px;
  font-weight: 600; 
}

.status-message {
  align-self: center;
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 14px;
  margin: 10px 0;
}

.status-message.info {
  background-color: #ecf5ff;
  color: #409eff;
}

.status-message.error {
  background-color: #fef0f0;
  color: #f56c6c;
}

/* 输入区域 */
.input-area {
  border-top: 1px solid #e4e7ed;
  padding: 5px;
  background-color: #fafafa;
  z-index: 10;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;
  min-height: 140px;
  max-height: 160px;
}

.chat-input-wrapper {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-input-container {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
  flex: 1;
  min-height: 130px;
  width: 80%;
  margin: 0 auto;
  max-width: 800px;
  
}

.chat-input-container:focus-within {
  border-color: #e4e7ed;
  
}

.chat-input-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

.input-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
  white-space: nowrap;
  height: 32px;
}

.input-buttons .el-button {
  padding: 4px;
  min-width: 28px;
  height: 28px;
  background-color: #f5f7fa;
  border-color: #e4e7ed;
}

.input-buttons .el-button:hover {
  background-color: #ecf5ff;
  border-color: #c6e2ff;
}

.input-buttons .optimize-button {
  min-width: auto;
  height: auto;
  background-color: #f0f0f0;
  border-color: #dcdfe6;
  color: #606266;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
}

.input-buttons .optimize-button:hover {
  background-color: #e6e6e6;
  border-color: #c0c4cc;
}

.chat-textarea {
  flex: 1;
  max-height: 200px;
}

.chat-textarea :deep(.el-textarea__inner) {
  border: none;
  resize: none;
  padding: 8px 0;
  font-size: 14px;
  line-height: 1.5;
  min-height: 120px;
  max-height: 200px;
  white-space: normal;
  word-wrap: normal;
  word-break: normal;
  overflow-wrap: break-word;
}

.chat-textarea :deep(.el-textarea__inner):focus {
  box-shadow: none;
}

.chat-buttons-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 4px;
}

.buttons-left {
  flex: 1;
}

.buttons-right {
  display: flex;
  align-items: center;
  gap: 8px;
}



.send-button {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-button:disabled {
  opacity: 0.5;
}

.model-select-container {
  margin-top: 10px;
  display: flex;
  vertical-align: top;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .model-debug-container {
    flex-direction: column;
  }

  .session-list {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
  }

  .message-item {
    max-width: 90%;
  }
}
</style>