<template>
  <div class="home">
    <el-card>
      <template #header>
        <h3>欢迎使用 AI 创作评审系统</h3>
      </template>
      <div class="welcome-content">
        <p>这是一个基于 AI 的创作评审平台，帮助您提升创作质量。</p>
        <div class="features">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card shadow="hover">
                <div class="feature-item">
                  <el-icon :size="40" color="#409eff"><Document /></el-icon>
                  <h4>智能评审</h4>
                  <p>AI 自动分析您的创作内容，提供专业的评审意见</p>
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover">
                <div class="feature-item">
                  <el-icon :size="40" color="#67c23a"><TrendCharts /></el-icon>
                  <h4>数据分析</h4>
                  <p>详细的创作数据分析，帮助您了解创作趋势</p>
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover">
                <div class="feature-item">
                  <el-icon :size="40" color="#e6a23c"><Star /></el-icon>
                  <h4>评分系统</h4>
                  <p>多维度的评分体系，全面评估作品质量</p>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Document, TrendCharts, Star } from '@element-plus/icons-vue';
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.home h3 {
  margin: 0;
  color: #333;
}

.welcome-content {
  padding: 20px 0;
}

.welcome-content > p {
  font-size: 16px;
  color: #666;
  text-align: center;
  margin-bottom: 40px;
}

.features {
  margin-top: 30px;
}

.feature-item {
  text-align: center;
  padding: 20px;
}

.feature-item h4 {
  margin: 15px 0 10px;
  color: #333;
}

.feature-item p {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}
</style>
