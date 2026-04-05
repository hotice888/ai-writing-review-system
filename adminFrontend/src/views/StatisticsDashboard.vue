<template>
  <div class="statistics-dashboard">
    <el-card class="filter-card">
      <div class="filter-container">
        <span class="filter-label">统计时间范围：</span>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :clearable="false"
          style="width: 380px"
          @change="handleDateChange"
        />
        <el-button type="primary" @click="loadAllData" :loading="loading" :icon="Refresh">
          刷新数据
        </el-button>
      </div>
    </el-card>

    <div v-if="!dateRange || dateRange.length < 2" class="empty-hint">
      <el-empty description="请选择统计时间范围开始分析" />
    </div>

    <div v-else>
      <el-row :gutter="20" class="overview-cards">
        <el-col :span="8">
          <el-card class="stat-card primary-card">
            <div class="stat-icon">
              <el-icon :size="40"><Coin /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatNumber(overview.total_tokens) }}</div>
              <div class="stat-label">总Token使用量</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="16">
          <el-card class="stat-card request-status-card">
            <div class="request-status-container">
              <div class="request-status-item success-item">
                <div class="request-icon success-icon">
                  <el-icon :size="32"><Check /></el-icon>
                </div>
                <div class="request-info">
                  <div class="request-value success">{{ formatNumber(overview.success_count) }}</div>
                  <div class="request-label">成功</div>
                </div>
              </div>
              <div class="request-divider"></div>
              <div class="request-status-item failure-item">
                <div class="request-icon failure-icon">
                  <el-icon :size="32"><Close /></el-icon>
                </div>
                <div class="request-info">
                  <div class="request-value failure">{{ formatNumber(overview.failure_count) }}</div>
                  <div class="request-label">失败</div>
                </div>
              </div>
              <div class="request-divider"></div>
              <div class="request-status-item rate-item">
                <div class="request-icon rate-icon">
                  <el-icon :size="32"><CircleCheck /></el-icon>
                </div>
                <div class="request-info">
                  <div class="request-value rate">{{ overview.success_rate }}%</div>
                  <div class="request-label">成功率</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>Token使用排名</span>
              </div>
            </template>
            <el-tabs v-model="rankingTab" @tab-change="loadRankings">
              <el-tab-pane label="业务类型" name="business_type" />
              <el-tab-pane label="用户" name="user" />
              <el-tab-pane label="模型标识" name="model" />
              <el-tab-pane label="模型平台" name="provider" />
            </el-tabs>
            <div class="ranking-list">
              <div v-for="(item, index) in rankings" :key="index" class="ranking-item">
                <div class="ranking-number" :class="'rank-' + (index + 1)">
                  {{ index + 1 }}
                </div>
                <div class="ranking-info">
                  <div class="ranking-name">{{ getRankingName(item, rankingTab) }}</div>
                  <div class="ranking-bar-container">
                    <div 
                      class="ranking-bar" 
                      :style="{ 
                        width: (item.token_count / maxRankingValue * 100) + '%',
                        background: getRankingColor(index)
                      }" 
                    />
                  </div>
                  <div class="ranking-value">{{ formatNumber(item.token_count) }}</div>
                </div>
              </div>
            </div>
            <el-empty v-if="rankings.length === 0" description="暂无数据" :image-size="80" />
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="trend-card">
            <template #header>
              <div class="card-header">
                <span>Token使用趋势</span>
                <div class="header-tabs">
                  <el-radio-group v-model="trendPeriod" size="small" @change="loadTrends">
                    <el-radio-button label="day">天</el-radio-button>
                    <el-radio-button label="week">周</el-radio-button>
                    <el-radio-button label="month">月</el-radio-button>
                    <el-radio-button label="year">年</el-radio-button>
                  </el-radio-group>
                  <el-button type="primary" size="small" link @click="openTrendDialog">
                    <el-icon><FullScreen /></el-icon>
                  </el-button>
                </div>
              </div>
            </template>
            <el-tabs v-model="trendTab" @tab-change="handleTrendTabChange">
              <el-tab-pane label="总Token" name="total" />
              <el-tab-pane label="业务类型" name="business_type" />
              <el-tab-pane label="模型标识" name="model" />
              <el-tab-pane label="模型平台" name="provider" />
            </el-tabs>
            
            <div v-if="trendTab !== 'total'" class="trend-selector">
              <el-select 
                v-model="selectedCategories" 
                placeholder="请选择" 
                multiple
                collapse-tags
                collapse-tags-tooltip
                style="width: 100%;"
                @change="loadTrends"
              >
                <el-option 
                  v-for="item in availableCategories" 
                  :key="item" 
                  :label="getCategoryDisplayName(item, trendTab)" 
                  :value="item" 
                />
              </el-select>
            </div>
            
            <div v-if="trendTab !== 'total'" class="trend-legend">
              <div 
                v-for="(item, index) in selectedCategories" 
                :key="item" 
                class="legend-item"
              >
                <div 
                  class="legend-color" 
                  :style="{ background: getCategoryColor(item, trendTab) }"
                />
                <span class="legend-text">{{ getCategoryDisplayName(item, trendTab) }}</span>
              </div>
            </div>
            
            <div class="trend-chart">
              <div class="trend-y-axis">
                <svg 
                  class="trend-y-svg" 
                  :viewBox="`0 0 60 ${chartHeight + 80}`"
                >
                  <g class="y-axis-labels">
                    <text 
                      v-for="(value, index) in yAxisLabels" 
                      :key="index"
                      :x="55"
                      :y="chartHeight + 20 - (chartHeight / 6) * index"
                      text-anchor="end"
                      dominant-baseline="middle"
                      class="svg-y-label"
                    >
                      {{ formatNumber(value) }}
                    </text>
                  </g>
                </svg>
              </div>
              <div 
                class="trend-content-scroll" 
                @scroll="handleChartScroll"
                ref="chartScrollRef"
              >
                <div class="trend-content" :style="{ width: chartTotalWidth + 'px' }">
                  <svg 
                    class="trend-svg" 
                    :viewBox="`-10 0 ${chartTotalWidth + 10} ${chartHeight + 80}`"
                    @mousemove="handleSvgMouseMove"
                    @mouseleave="hideTooltip"
                    :style="{ width: chartTotalWidth + 'px' }"
                  >
                    <g class="grid-lines">
                      <line 
                        v-for="i in 7" 
                        :key="`grid-${i}`"
                        :x1="0"
                        :y1="chartHeight + 20 - (chartHeight / 6) * (i - 1)"
                        :x2="chartTotalWidth"
                        :y2="chartHeight + 20 - (chartHeight / 6) * (i - 1)"
                        stroke="#f0f0f0"
                        stroke-width="1"
                      />
                    </g>
                    
                    <g class="y-axis-lines">
                      <line x1="0" y1="20" x2="0" :y2="chartHeight + 20" stroke="#909399" stroke-width="2"/>
                      <polygon points="-5,20 0,5 5,20" fill="#909399"/>
                    </g>
                    
                    <g class="x-axis-lines">
                      <line x1="0" :y1="chartHeight + 20" :x2="chartTotalWidth" :y2="chartHeight + 20" stroke="#909399" stroke-width="2"/>
                      <polygon :points="`${chartTotalWidth - 5},${chartHeight + 15} ${chartTotalWidth},${chartHeight + 20} ${chartTotalWidth - 5},${chartHeight + 25}`" fill="#909399"/>
                    </g>
                    
                    <g v-if="trendTab === 'total'" class="trend-bar-group">
                      <rect 
                        v-for="(point, index) in totalTrendPointsArray"
                        :key="`bar-${index}`"
                        :x="point.x - point.barWidth / 2"
                        :y="point.y"
                        :width="point.barWidth"
                        :height="chartHeight + 20 - point.y"
                        fill="#409eff"
                        rx="2"
                        @mouseenter="showCategoryTooltip('total', point.value, point.originalIndex, $event)"
                        @mouseleave="hideTooltip"
                        style="cursor: pointer;"
                      />
                      <circle 
                        v-for="(point, index) in totalTrendPointsArray"
                        :key="`dot-${index}`"
                        :cx="point.x"
                        :cy="chartHeight + 20"
                        r="5"
                        fill="#f56c6c"
                        stroke="white"
                        stroke-width="2"
                      />
                    </g>
                    
                    <g v-else class="trend-line-group">
                      <g v-for="(category, catIndex) in selectedCategories" :key="category">
                        <polyline 
                          :points="getCategoryTrendPoints(category)"
                          fill="none"
                          :stroke="getCategoryColor(category, trendTab)"
                          stroke-width="2"
                        />
                        <circle 
                          v-for="(point, index) in getCategoryTrendPointsArray(category)"
                          :key="`${category}-${index}`"
                          :cx="point.x"
                          :cy="point.y"
                          r="4"
                          :fill="getCategoryColor(category, trendTab)"
                          stroke="white"
                          stroke-width="2"
                          @mouseenter="showCategoryTooltip(category, point.value, point.originalIndex, $event)"
                          @mouseleave="hideTooltip"
                        />
                      </g>
                    </g>
                    
                    <g class="x-axis-labels">
                      <text 
                        v-for="(period, index) in periodLabels" 
                        :key="index"
                        :x="periodWidth * index + periodWidth / 2"
                        :y="chartHeight + 38"
                        text-anchor="middle"
                        class="svg-x-label"
                      >
                        <tspan 
                          v-for="(line, lineIndex) in formatPeriodLabelLines(period, trendPeriod)" 
                          :key="lineIndex"
                          :x="periodWidth * index + periodWidth / 2"
                          :dy="lineIndex > 0 ? '14' : '0'"
                        >
                          {{ line }}
                        </tspan>
                      </text>
                    </g>
                  </svg>
                </div>
              </div>
              <div 
                v-if="tooltipVisible"
                class="trend-tooltip"
                :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
              >
                <div class="tooltip-value">{{ formatNumber(tooltipValue) }}</div>
              </div>
            </div>
            <el-empty v-if="displayTrends.length === 0" description="暂无数据" :image-size="80" />
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <el-dialog
      v-model="trendDialogVisible"
      title="Token使用趋势"
      width="90vw"
      padding="0px"
      top="5vh"
      :close-on-click-modal="false"
      @closed="closeTrendDialog"
    >
      <div class="trend-dialog-content">
        <div class="dialog-header-tabs">
          <el-radio-group v-model="trendPeriod" size="small" @change="loadTrends">
            <el-radio-button label="day">天</el-radio-button>
            <el-radio-button label="week">周</el-radio-button>
            <el-radio-button label="month">月</el-radio-button>
            <el-radio-button label="year">年</el-radio-button>
          </el-radio-group>
        </div>
        <el-tabs v-model="trendTab" @tab-change="handleTrendTabChange">
          <el-tab-pane label="总Token" name="total" />
          <el-tab-pane label="业务类型" name="business_type" />
          <el-tab-pane label="模型标识" name="model" />
          <el-tab-pane label="模型平台" name="provider" />
        </el-tabs>
        
        <div v-if="trendTab !== 'total'" class="trend-selector">
          <el-select 
            v-model="selectedCategories" 
            placeholder="请选择" 
            multiple
            collapse-tags
            collapse-tags-tooltip
            style="width: 100%;"
            @change="loadTrends"
          >
            <el-option 
              v-for="item in availableCategories" 
              :key="item" 
              :label="getCategoryDisplayName(item, trendTab)" 
              :value="item" 
            />
          </el-select>
        </div>
        
        <div v-if="trendTab !== 'total'" class="trend-legend">
          <div 
            v-for="(item, index) in selectedCategories" 
            :key="item" 
            class="legend-item"
          >
            <div 
              class="legend-color" 
              :style="{ background: getCategoryColor(item, trendTab) }"
            />
            <span class="legend-text">{{ getCategoryDisplayName(item, trendTab) }}</span>
          </div>
        </div>
        
        <div class="trend-chart-dialog">
          <div class="trend-y-axis-dialog">
            <svg 
              class="trend-y-svg" 
              :viewBox="`0 0 60 ${dialogChartHeight + 80}`"
            >
              <g class="y-axis-labels">
                <text 
                  v-for="(value, index) in yAxisLabels" 
                  :key="index"
                  :x="55"
                  :y="dialogChartHeight + 20 - (dialogChartHeight / 6) * index"
                  text-anchor="end"
                  dominant-baseline="middle"
                  class="svg-y-label"
                >
                  {{ formatNumber(value) }}
                </text>
              </g>
            </svg>
          </div>
          <div 
            class="trend-content-scroll-dialog" 
            @scroll="handleDialogChartScroll"
            ref="dialogChartScrollRef"
          >
            <div class="trend-content-dialog" :style="{ width: chartTotalWidth + 'px' }">
              <svg 
                class="trend-svg" 
                :viewBox="`-10 0 ${chartTotalWidth + 10} ${dialogChartHeight + 80}`"
                @mousemove="handleSvgMouseMove"
                @mouseleave="hideTooltip"
                :style="{ width: chartTotalWidth + 'px' }"
              >
                <g class="grid-lines">
                  <line 
                    v-for="i in 7" 
                    :key="`grid-${i}`"
                    :x1="0"
                    :y1="dialogChartHeight + 20 - (dialogChartHeight / 6) * (i - 1)"
                    :x2="chartTotalWidth"
                    :y2="dialogChartHeight + 20 - (dialogChartHeight / 6) * (i - 1)"
                    stroke="#f0f0f0"
                    stroke-width="1"
                  />
                </g>
                
                <g class="y-axis-lines">
                  <line x1="0" y1="20" x2="0" :y2="dialogChartHeight + 20" stroke="#909399" stroke-width="2"/>
                  <polygon points="-5,20 0,5 5,20" fill="#909399"/>
                </g>
                
                <g class="x-axis-lines">
                  <line x1="0" :y1="dialogChartHeight + 20" :x2="chartTotalWidth" :y2="dialogChartHeight + 20" stroke="#909399" stroke-width="2"/>
                  <polygon :points="`${chartTotalWidth - 5},${dialogChartHeight + 15} ${chartTotalWidth},${dialogChartHeight + 20} ${chartTotalWidth - 5},${dialogChartHeight + 25}`" fill="#909399"/>
                </g>
                
                <g v-if="trendTab === 'total'" class="trend-bar-group">
                  <rect 
                    v-for="(point, index) in dialogTotalTrendPointsArray"
                    :key="`bar-${index}`"
                    :x="point.x - point.barWidth / 2"
                    :y="point.y"
                    :width="point.barWidth"
                    :height="dialogChartHeight + 20 - point.y"
                    fill="#409eff"
                    rx="2"
                    @mouseenter="showCategoryTooltip('total', point.value, point.originalIndex, $event)"
                    @mouseleave="hideTooltip"
                    style="cursor: pointer;"
                  />
                  <circle 
                    v-for="(point, index) in dialogTotalTrendPointsArray"
                    :key="`dot-${index}`"
                    :cx="point.x"
                    :cy="dialogChartHeight + 20"
                    r="5"
                    fill="#f56c6c"
                    stroke="white"
                    stroke-width="2"
                  />
                </g>
                
                <g v-else class="trend-line-group">
                  <g v-for="(category, catIndex) in selectedCategories" :key="category">
                    <polyline 
                      :points="getDialogCategoryTrendPoints(category)"
                      fill="none"
                      :stroke="getCategoryColor(category, trendTab)"
                      stroke-width="2"
                    />
                    <circle 
                      v-for="(point, index) in getDialogCategoryTrendPointsArray(category)"
                      :key="`${category}-${index}`"
                      :cx="point.x"
                      :cy="point.y"
                      r="4"
                      :fill="getCategoryColor(category, trendTab)"
                      stroke="white"
                      stroke-width="2"
                      @mouseenter="showCategoryTooltip(category, point.value, point.originalIndex, $event)"
                      @mouseleave="hideTooltip"
                    />
                  </g>
                </g>
                
                <g class="x-axis-labels">
                  <text 
                    v-for="(period, index) in periodLabels" 
                    :key="index"
                    :x="periodWidth * index + periodWidth / 2"
                    :y="dialogChartHeight + 38"
                    text-anchor="middle"
                    class="svg-x-label"
                  >
                    <tspan 
                      v-for="(line, lineIndex) in formatPeriodLabelLines(period, trendPeriod)" 
                      :key="lineIndex"
                      :x="periodWidth * index + periodWidth / 2"
                      :dy="lineIndex > 0 ? '14' : '0'"
                    >
                      {{ line }}
                    </tspan>
                  </text>
                </g>
              </svg>
            </div>
          </div>
          <div 
            v-if="tooltipVisible"
            class="trend-tooltip"
            :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
          >
            <div class="tooltip-value">{{ formatNumber(tooltipValue) }}</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Coin, CircleCheck, Check, Close, FullScreen } from '@element-plus/icons-vue';
import { getStatisticsOverview, getStatisticsRankings, getStatisticsTrends, getUserModels, getModelProviders } from '../api/admin';

const loading = ref(false);
const dateRange = ref([]);
const overview = ref({
  total_tokens: 0,
  total_requests: 0,
  success_count: 0,
  failure_count: 0,
  success_rate: 0
});

const rankingTab = ref('business_type');
const rankings = ref([]);

const trendPeriod = ref('day');
const trendTab = ref('total');
const trends = ref([]);
const selectedCategories = ref([]);
const tooltipVisible = ref(false);
const tooltipCategory = ref('');
const tooltipValue = ref(0);
const tooltipPeriod = ref('');
const tooltipX = ref(0);
const tooltipY = ref(0);
const trendDialogVisible = ref(false);
const userModels = ref([]);
const modelProviders = ref([]);
const chartScrollRef = ref(null);
const dialogChartScrollRef = ref(null);

const chartHeight = 200;
const dialogChartHeight = 300;
const periodWidth = 40;
const visiblePeriodsCount = 12;
const scrollOffset = ref(0);
const dialogScrollOffset = ref(0);

const chartTotalWidth = computed(() => {
  const numPeriods = periodLabels.value.length;
  const minPeriods = visiblePeriodsCount;
  const actualPeriods = Math.max(numPeriods, minPeriods);
  return actualPeriods * periodWidth;
});

const businessTypeMap = {
  '连通测试': '连通测试',
  '模型调试': '模型调试',
  'test': '连通测试',
  'agent': '智能体',
  'writing': '写作',
  'api_call': 'API调用',
  'debug': '模型调试'
};

const categoryColors = [
  '#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399',
  '#00d4ff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe', '#00b894'
];

const categoryColorMap = ref({});

const getCeilMaxValue = (value) => {
  if (value === 0) return 10;
  if (value <= 10) return 10;
  if (value <= 50) return 50;
  if (value <= 100) return 100;
  if (value <= 500) return 500;
  if (value <= 1000) return 1000;
  if (value <= 5000) return 5000;
  if (value <= 10000) return 10000;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const factor = Math.ceil(value / magnitude);
  return factor * magnitude;
};

const maxTrendValue = computed(() => {
  if (trendTab.value === 'total') {
    const values = displayTrends.value.map(t => t.token_count);
    const rawMax = values.length > 0 ? Math.max(...values) : 0;
    return getCeilMaxValue(rawMax);
  }
  
  let max = 0;
  selectedCategories.value.forEach(category => {
    const categoryData = displayTrends.value.filter(t => t.category === category);
    const values = categoryData.map(t => t.token_count);
    if (values.length > 0) {
      max = Math.max(max, ...values);
    }
  });
  return getCeilMaxValue(max);
});

const yAxisLabels = computed(() => {
  const maxVal = maxTrendValue.value;
  return [
    0,
    Math.round(maxVal * 0.2),
    Math.round(maxVal * 0.4),
    Math.round(maxVal * 0.6),
    Math.round(maxVal * 0.8),
    maxVal,
    Math.round(maxVal * 1.2)
  ];
});

const maxRankingValue = computed(() => {
  if (rankings.value.length === 0) return 0;
  return Math.max(...rankings.value.map(r => r.token_count));
});

const availableCategories = computed(() => {
  if (trendTab.value === 'total') return [];
  if (trendTab.value === 'model') {
    return [...new Set(userModels.value.map(m => m.model))].filter(Boolean);
  }
  if (trendTab.value === 'provider') {
    return [...new Set(modelProviders.value.filter(p => p.status === 'enabled').map(p => p.name))].filter(Boolean);
  }
  const categories = [...new Set(trends.value.map(t => t.category))];
  return categories;
});

const periodLabels = computed(() => {
  if (displayTrends.value.length === 0) return [];
  if (trendTab.value === 'total') {
    return displayTrends.value.map(t => t.period);
  }
  return [...new Set(displayTrends.value.map(t => t.period))];
});

const displayTrends = computed(() => {
  let data = [];
  
  if (trendTab.value === 'total') {
    data = trends.value;
  } else {
    data = trends.value;
  }
  
  return fillEmptyPeriods(data, trendPeriod.value, dateRange.value);
});

const totalTrendPointsArray = computed(() => {
  const points = [];
  const periods = periodLabels.value;
  const plotHeight = chartHeight;
  const barWidth = 36;
  
  periods.forEach((period, index) => {
    const item = displayTrends.value.find(t => t.period === period);
    const x = periodWidth * index + periodWidth / 2;
    const y = chartHeight + 20 - ((item ? item.token_count : 0) / Math.max(maxTrendValue.value * 1.2, 1)) * plotHeight;
    points.push({ x, y, value: item ? item.token_count : 0, period, barWidth, originalIndex: index });
  });
  
  return points;
});

const dialogTotalTrendPointsArray = computed(() => {
  const points = [];
  const periods = periodLabels.value;
  const plotHeight = dialogChartHeight;
  const barWidth = 36;
  
  periods.forEach((period, index) => {
    const item = displayTrends.value.find(t => t.period === period);
    const x = periodWidth * index + periodWidth / 2;
    const y = dialogChartHeight + 20 - ((item ? item.token_count : 0) / Math.max(maxTrendValue.value * 1.2, 1)) * plotHeight;
    points.push({ x, y, value: item ? item.token_count : 0, period, barWidth, originalIndex: index });
  });
  
  return points;
});

const getCategoryTrendPointsArray = (category) => {
  const points = [];
  const periods = periodLabels.value;
  const plotHeight = chartHeight;
  
  periods.forEach((period, index) => {
    const item = displayTrends.value.find(t => t.period === period && t.category === category);
    const x = periodWidth * index + periodWidth / 2;
    const y = chartHeight + 20 - ((item ? item.token_count : 0) / Math.max(maxTrendValue.value * 1.2, 1)) * plotHeight;
    points.push({ x, y, value: item ? item.token_count : 0, period, originalIndex: index });
  });
  
  return points;
};

const getCategoryTrendPoints = (category) => {
  return getCategoryTrendPointsArray(category).map(p => `${p.x},${p.y}`).join(' ');
};

const getDialogCategoryTrendPointsArray = (category) => {
  const points = [];
  const periods = periodLabels.value;
  const plotHeight = dialogChartHeight;
  
  periods.forEach((period, index) => {
    const item = displayTrends.value.find(t => t.period === period && t.category === category);
    const x = periodWidth * index + periodWidth / 2;
    const y = dialogChartHeight + 20 - ((item ? item.token_count : 0) / Math.max(maxTrendValue.value * 1.2, 1)) * plotHeight;
    points.push({ x, y, value: item ? item.token_count : 0, period, originalIndex: index });
  });
  
  return points;
};

const getDialogCategoryTrendPoints = (category) => {
  return getDialogCategoryTrendPointsArray(category).map(p => `${p.x},${p.y}`).join(' ');
};

const getCurrentPeriodLabel = () => {
  if (!dateRange.value || dateRange.value.length !== 2) {
    return '';
  }
  
  const startDate = new Date(dateRange.value[0]);
  const endDate = new Date(dateRange.value[1]);
  const middleDate = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2);
  
  const period = trendPeriod.value;
  
  if (period === 'day') {
    return middleDate.toISOString().split('T')[0];
  } else if (period === 'week') {
    const year = middleDate.getFullYear();
    const weekNum = getISOWeekNumber(middleDate);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  } else if (period === 'month') {
    return `${middleDate.getFullYear()}-${String(middleDate.getMonth() + 1).padStart(2, '0')}`;
  } else if (period === 'year') {
    return String(middleDate.getFullYear());
  }
  return '';
};

const scrollToCurrentPeriod = () => {
  nextTick(() => {
    const currentPeriod = getCurrentPeriodLabel();
    const periods = periodLabels.value;
    const currentIndex = periods.indexOf(currentPeriod);
    
    let targetIndex = currentIndex >= 0 ? currentIndex : periods.length - 1;
    const targetScrollLeft = Math.max(0, (targetIndex - Math.floor(visiblePeriodsCount / 2)) * periodWidth);
    
    scrollOffset.value = targetScrollLeft;
    
    if (chartScrollRef.value) {
      chartScrollRef.value.scrollLeft = targetScrollLeft;
    }
    
    dialogScrollOffset.value = targetScrollLeft;
    if (dialogChartScrollRef.value) {
      dialogChartScrollRef.value.scrollLeft = targetScrollLeft;
    }
  });
};

const getCategoryColor = (category, type) => {
  const key = `${type}-${category}`;
  if (!categoryColorMap.value[key]) {
    const allKeys = Object.keys(categoryColorMap.value);
    const colorIndex = allKeys.length % categoryColors.length;
    categoryColorMap.value[key] = categoryColors[colorIndex];
  }
  return categoryColorMap.value[key];
};

const fillEmptyPeriods = (data, period, range) => {
  if (!range || range.length < 2) return data;
  
  const result = [];
  const startDate = new Date(range[0]);
  const endDate = new Date(range[1]);
  
  if (period === 'day') {
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      if (trendTab.value === 'total') {
        const existing = data.find(d => d.period === dateStr);
        result.push({
          period: dateStr,
          token_count: existing ? existing.token_count : 0
        });
      } else {
        selectedCategories.value.forEach(category => {
          const existing = data.find(d => d.period === dateStr && d.category === category);
          result.push({
            period: dateStr,
            token_count: existing ? existing.token_count : 0,
            category: category
          });
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else if (period === 'week') {
    const weeks = new Set();
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const weekNum = getISOWeekNumber(currentDate);
      const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`;
      weeks.add(weekKey);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const sortedWeeks = Array.from(weeks).sort();
    sortedWeeks.forEach(weekKey => {
      if (trendTab.value === 'total') {
        const existing = data.find(d => d.period === weekKey);
        result.push({
          period: weekKey,
          token_count: existing ? existing.token_count : 0
        });
      } else {
        selectedCategories.value.forEach(category => {
          const existing = data.find(d => d.period === weekKey && d.category === category);
          result.push({
            period: weekKey,
            token_count: existing ? existing.token_count : 0,
            category: category
          });
        });
      }
    });
  } else if (period === 'month') {
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonthDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    
    while (currentDate <= endMonthDate) {
      const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (trendTab.value === 'total') {
        const existing = data.find(d => d.period === monthStr);
        result.push({
          period: monthStr,
          token_count: existing ? existing.token_count : 0
        });
      } else {
        selectedCategories.value.forEach(category => {
          const existing = data.find(d => d.period === monthStr && d.category === category);
          result.push({
            period: monthStr,
            token_count: existing ? existing.token_count : 0,
            category: category
          });
        });
      }
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  } else if (period === 'year') {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    
    for (let year = startYear; year <= endYear; year++) {
      const yearStr = String(year);
      
      if (trendTab.value === 'total') {
        const existing = data.find(d => String(d.period) === yearStr);
        result.push({
          period: yearStr,
          token_count: existing ? existing.token_count : 0
        });
      } else {
        selectedCategories.value.forEach(category => {
          const existing = data.find(d => String(d.period) === yearStr && d.category === category);
          result.push({
            period: yearStr,
            token_count: existing ? existing.token_count : 0,
            category: category
          });
        });
      }
    }
  }
  
  return result;
};

const getISOWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('zh-CN');
};

const formatPeriodLabel = (period, periodType) => {
  if (periodType === 'day') {
    const match = period.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[2]}-${match[3]}`;
    }
    return period;
  }
  
  if (periodType === 'week') {
    const yearWeekMatch = period.match(/(\d{4})-W(\d+)/);
    if (yearWeekMatch) {
      const year = parseInt(yearWeekMatch[1]);
      const week = parseInt(yearWeekMatch[2]);
      const startDate = getStartOfWeek(year, week);
      const endDate = getEndOfWeek(year, week);
      return `${formatMMDD(startDate)}\n${formatMMDD(endDate)}`;
    }
    return period;
  }
  
  return period;
};

const formatPeriodLabelLines = (period, periodType) => {
  const label = formatPeriodLabel(period, periodType);
  return label.split('\n');
};

const formatMMDD = (date) => {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}-${d}`;
};

const getStartOfWeek = (year, week) => {
  const firstDayOfYear = new Date(Date.UTC(year, 0, 4));
  const dayNum = firstDayOfYear.getUTCDay() || 7;
  const firstThursday = new Date(firstDayOfYear);
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 4 - dayNum);
  const startDate = new Date(firstThursday);
  startDate.setUTCDate(startDate.getUTCDate() + (week - 1) * 7 - 3);
  return new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
};

const getEndOfWeek = (year, week) => {
  const startDate = getStartOfWeek(year, week);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  return endDate;
};

const getRankingName = (item, type) => {
  if (type === 'business_type') {
    return businessTypeMap[item.name] || item.name;
  }
  return item.name;
};

const getCategoryDisplayName = (item, type) => {
  if (type === 'business_type') {
    return businessTypeMap[item] || item;
  }
  return item;
};

const getRankingColor = (index) => {
  const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'];
  return colors[index % colors.length];
};

const showCategoryTooltip = (category, value, index, event) => {
  tooltipValue.value = value;
  tooltipVisible.value = true;
  
  if (event) {
    tooltipX.value = event.offsetX + 10;
    tooltipY.value = event.offsetY - 30;
  }
};

const hideTooltip = () => {
  tooltipVisible.value = false;
};

const handleSvgMouseMove = (event) => {
  
};

const handleChartScroll = (event) => {
  scrollOffset.value = event.target.scrollLeft;
};

const handleDialogChartScroll = (event) => {
  dialogScrollOffset.value = event.target.scrollLeft;
};

const openTrendDialog = () => {
  trendDialogVisible.value = true;
  nextTick(() => {
    if (dialogChartScrollRef.value) {
      dialogChartScrollRef.value.scrollLeft = scrollOffset.value;
      dialogScrollOffset.value = scrollOffset.value;
    }
  });
};

const closeTrendDialog = () => {
  if (chartScrollRef.value) {
    chartScrollRef.value.scrollLeft = dialogScrollOffset.value;
    scrollOffset.value = dialogScrollOffset.value;
  }
};

const handleTrendTabChange = () => {
  const categories = availableCategories.value;
  selectedCategories.value = categories.slice(0, 2);
  loadTrends();
};

const loadUserModels = async () => {
  try {
    const data = await getUserModels();
    userModels.value = data || [];
  } catch (error) {
    console.error('加载用户模型失败', error);
  }
};

const loadModelProviders = async () => {
  try {
    const data = await getModelProviders();
    modelProviders.value = data || [];
  } catch (error) {
    console.error('加载模型提供商失败', error);
  }
};

const loadOverview = async () => {
  try {
    const data = await getStatisticsOverview({
      start_date: dateRange.value[0],
      end_date: dateRange.value[1]
    });
    overview.value = data;
  } catch (error) {
    ElMessage.error('加载概览统计失败');
    console.error(error);
  }
};

const loadRankings = async () => {
  try {
    const data = await getStatisticsRankings({
      start_date: dateRange.value[0],
      end_date: dateRange.value[1],
      type: rankingTab.value
    });
    rankings.value = data || [];
  } catch (error) {
    ElMessage.error('加载排名数据失败');
    console.error(error);
  }
};

const loadTrends = async () => {
  try {
    const data = await getStatisticsTrends({
      start_date: dateRange.value[0],
      end_date: dateRange.value[1],
      period: trendPeriod.value,
      type: trendTab.value
    });
    trends.value = data || [];
    
    if (trendTab.value !== 'total' && availableCategories.value.length > 0 && selectedCategories.value.length === 0) {
      selectedCategories.value = availableCategories.value.slice(0, 2);
    }
    
    scrollToCurrentPeriod();
  } catch (error) {
    ElMessage.error('加载趋势数据失败');
    console.error(error);
  }
};

const loadAllData = async () => {
  if (!dateRange.value || dateRange.value.length < 2) {
    ElMessage.warning('请先选择统计时间范围');
    return;
  }
  
  loading.value = true;
  try {
    await Promise.all([
      loadOverview(),
      loadRankings(),
      loadTrends()
    ]);
    ElMessage.success('数据加载成功');
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleDateChange = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    const categories = availableCategories.value;
    selectedCategories.value = categories.slice(0, 2);
    loadAllData();
  }
};

onMounted(async () => {
  const today = new Date();
  const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  dateRange.value = [formatDate(last7Days), formatDate(today)];
  
  await Promise.all([
    loadUserModels(),
    loadModelProviders()
  ]);
  
  loadAllData();
});
</script>

<style scoped>
.statistics-dashboard {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-weight: 500;
}

.overview-cards {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
}

.primary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.primary-card :deep(.el-card__body) {
  display: flex;
  padding: 20px;
}

.stat-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.request-status-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
}

.request-status-container {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.request-status-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.request-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-icon {
  background: rgba(103, 194, 58, 0.2);
}

.failure-icon {
  background: rgba(245, 108, 108, 0.2);
}

.rate-icon {
  background: rgba(64, 158, 255, 0.2);
}

.request-info {
  text-align: center;
}

.request-value {
  font-size: 24px;
  font-weight: bold;
}

.request-value.success {
  color: #67c23a;
}

.request-value.failure {
  color: #f56c6c;
}

.request-value.rate {
  color: #409eff;
}

.request-label {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 4px;
}

.request-divider {
  width: 1px;
  height: 60px;
  background: rgba(255,255,255,0.2);
}

.empty-hint {
  text-align: center;
  padding: 60px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-tabs {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ranking-list {
  padding: 10px 0;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  margin-right: 12px;
  flex-shrink: 0;
}

.ranking-number.rank-1 {
  background: #ffd700;
}

.ranking-number.rank-2 {
  background: #c0c0c0;
}

.ranking-number.rank-3 {
  background: #cd7f32;
}

.ranking-number.rank-4,
.ranking-number.rank-5 {
  background: #909399;
}

.ranking-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.ranking-name {
  width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.ranking-bar-container {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.ranking-bar {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease;
}

.ranking-value {
  width: 80px;
  text-align: right;
  font-weight: bold;
  color: #409eff;
}

.trend-card {
  overflow: hidden;
}

.trend-selector {
  padding: 10px 20px 0 20px;
}

.trend-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 10px 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-text {
  font-size: 12px;
  color: #606266;
}

.trend-chart {
  display: flex;
  align-items: flex-start;
  position: relative;
  height: 320px;
}

.trend-chart-dialog {
  display: flex;
  align-items: flex-start;
  position: relative;
  height: 420px;
}

.trend-y-axis {
  width: 60px;
  flex-shrink: 0;
  height: 280px;
}

.trend-y-axis-dialog {
  width: 60px;
  flex-shrink: 0;
  height: 380px;
}

.trend-y-svg {
  width: 100%;
  height: 100%;
}

.trend-content-scroll {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  height: 280px;
  scroll-behavior: smooth;
}

.trend-content-scroll-dialog {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  height: 380px;
  scroll-behavior: smooth;
}

.trend-content {
  height: 280px;
}

.trend-content-dialog {
  height: 380px;
}

.trend-svg {
  height: 100%;
}

.svg-y-label {
  font-size: 11px;
  color: #909399;
}

.svg-x-label {
  font-size: 11px;
  color: #606266;
}

.grid-lines {
  pointer-events: none;
}

.trend-line-group {
  pointer-events: none;
}

.trend-line-group circle {
  pointer-events: auto;
  cursor: pointer;
}

.trend-tooltip {
  position: absolute;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 1000;
  pointer-events: none;
}

.tooltip-value {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.trend-dialog-content {
  padding: 0;
  height: 520px;
}

.dialog-header-tabs {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
  padding: 0 20px;
}

:deep(.el-card__header) {
  padding: 10px;
}

:deep(.el-card__body) {
  padding: 10px;
}
</style>
