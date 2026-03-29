<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <slot name="form"></slot>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="loading">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

interface Props {
  modelValue: boolean;
  title: string;
  width?: string;
  loading?: boolean;
  rules?: FormRules;
}

const props = withDefaults(defineProps<Props>(), {
  width: '500px',
  loading: false,
  rules: () => ({}),
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
}>();

const visible = ref(props.modelValue);
const formRef = ref<FormInstance>();
const formData = ref<any>({});

watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal;
  }
);

watch(visible, (newVal) => {
  emit('update:modelValue', newVal);
});

const handleClose = () => {
  visible.value = false;
  formRef.value?.resetFields();
};

const handleConfirm = async () => {
  const valid = await formRef.value?.validate();
  if (valid) {
    emit('confirm');
  }
};

defineExpose({
  formData,
  formRef,
});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
