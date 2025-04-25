<template>
  <div class="admin-homepage-editor">
    <div class="main-header">
      <h2>后台首页内容管理</h2>
      <el-button type="primary" @click="saveHomepageLayout" :loading="isSaving">保存布局</el-button>
    </div>

    <div v-if="isLoading" class="loading-area">加载中...</div>
    <div v-else-if="errorMessage" class="error-area">{{ errorMessage }}</div>

    <div v-else class="blocks-container">
       <p class="page-hint">在此处添加、编辑、删除和排序首页的内容区块。顺序将决定它们在页面和导航中的显示次序。</p>
      
      <div v-for="(block, index) in homepageBlocks" :key="block.id || `new-${index}`" class="dynamic-list-item homepage-block-item">
        <el-row :gutter="20">
          <el-col :span="20"> 
             <el-form-item 
                :label="`区块 ${index + 1} - 导航标题 (Nav Title)`" 
                :rules="[{ required: true, message: '导航标题不能为空', trigger: 'blur' }]"
              >
                <el-input v-model="block.nav_title" placeholder="显示在页面内导航的标题" />
             </el-form-item>
            
            <el-form-item 
               :label="`区块 ${index + 1} - 区块 ID (Block ID)`" 
               :rules="blockIdRules"
             >
               <el-input v-model="block.block_id" placeholder="用于页面内锚点链接, 只能小写字母/数字/连字符" />
            </el-form-item>

            <el-form-item 
              :label="`区块 ${index + 1} - 内容 (HTML)`" 
              :rules="[{ required: false, message: '内容不能为空', trigger: 'blur' }]"
            >
            <!-- Content can be optional -->
              <el-input 
                type="textarea" 
                v-model="block.html_content" 
                :rows="8" 
                placeholder="输入区块的 HTML 内容 (可为空)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="4" class="dynamic-list-actions block-actions">
            <el-button @click="moveBlock(index, -1)" :disabled="index === 0" :icon="ArrowUpBold" circle plain title="上移"/>
            <el-button @click="moveBlock(index, 1)" :disabled="index === homepageBlocks.length - 1" :icon="ArrowDownBold" circle plain title="下移"/>
            <el-button type="danger" @click="removeBlock(index)" :icon="Delete" circle plain title="删除"/>
          </el-col>
        </el-row>
         <el-divider v-if="index < homepageBlocks.length - 1" />
      </div>

      <div class="add-block-section">
         <el-button @click="addBlock" type="success" plain :icon="Plus">添加新区块</el-button>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage, ElMessageBox, ElButton, ElInput, ElFormItem, ElRow, ElCol, ElDivider } from 'element-plus';
import { Plus, Delete, ArrowUpBold, ArrowDownBold } from '@element-plus/icons-vue';

// --- State ---
const homepageBlocks = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const isSaving = ref(false);

// --- Form Rules (for individual fields within the loop) ---
// We don't use a single el-form for the whole page, so rules are applied per item if needed,
// but primary validation happens before saving.
const blockIdRules = [
  { required: true, message: '区块 ID 不能为空', trigger: 'blur' },
  { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'ID 只能包含小写字母、数字和连字符', trigger: 'blur' }
];

// --- API Setup ---
const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const api = axios.create({ baseURL: baseUrl });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin-auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Fetch Data --- 
const fetchHomepageBlocks = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await api.get('/admin/homepage-blocks');
    homepageBlocks.value = response.data || [];
    console.log('Fetched homepage blocks:', homepageBlocks.value);
  } catch (error) {
    console.error("Error fetching homepage blocks:", error);
    errorMessage.value = error.response?.data?.message || '加载首页布局失败';
  } finally {
    isLoading.value = false;
  }
};

// --- Block Manipulation Methods --- 
const addBlock = () => {
  homepageBlocks.value.push({
    // No id initially, backend assigns on save but we need keys
    block_id: 'new-block-' + Date.now(), // Temporary unique ID for key prop
    nav_title: '',
    html_content: ''
    // display_order is handled by array index on save
  });
};

const removeBlock = (index) => {
  ElMessageBox.confirm(
    `确定要删除区块 ${index + 1} (${homepageBlocks.value[index].nav_title || '未命名'}) 吗？`, 
    '确认删除',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
      homepageBlocks.value.splice(index, 1);
      ElMessage.info('区块已移除 (尚未保存)');
  }).catch(() => { /* User cancelled */ });
};

const moveBlock = (index, direction) => {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= homepageBlocks.value.length) {
    return; // Prevent moving out of bounds
  }
  // Swap elements
  const itemToMove = homepageBlocks.value.splice(index, 1)[0];
  homepageBlocks.value.splice(newIndex, 0, itemToMove);
};

// --- Save Layout --- 
const saveHomepageLayout = async () => {
  isSaving.value = true;
  errorMessage.value = '';

  // Basic client-side validation before sending
  const uniqueBlockIds = new Set();
  for (const block of homepageBlocks.value) {
    if (!block.block_id || !block.nav_title) {
       ElMessage.error('所有区块都必须填写导航标题和区块 ID。');
       isSaving.value = false;
       return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(block.block_id)) {
        ElMessage.error(`区块 ID "${block.block_id}" 格式无效。只能包含小写字母、数字和连字符。`);
        isSaving.value = false;
        return;
    }
    if (uniqueBlockIds.has(block.block_id)) {
        ElMessage.error(`区块 ID "${block.block_id}" 重复。请确保所有区块 ID 唯一。`);
        isSaving.value = false;
        return;
    }
    uniqueBlockIds.add(block.block_id);
  }

  console.log('Saving homepage layout:', homepageBlocks.value);

  try {
    // Send the entire array to the PUT endpoint
    await api.put('/admin/homepage-blocks', homepageBlocks.value);
    ElMessage.success('首页布局保存成功！');
    // Optionally re-fetch data to get updated IDs/order if backend modifies them,
    // but PUT replace should be consistent with sent order.
    // fetchHomepageBlocks(); 
  } catch (error) {
    console.error("Error saving homepage layout:", error);
    errorMessage.value = error.response?.data?.message || '保存首页布局失败';
    ElMessage.error(errorMessage.value);
  } finally {
    isSaving.value = false;
  }
};

// --- Lifecycle Hook --- 
onMounted(() => {
  fetchHomepageBlocks();
});

</script>

<style scoped>
.admin-homepage-editor {
  padding: 20px;
}
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}
.main-header h2 {
    margin: 0;
}
.loading-area, .error-area {
  padding: 40px 20px;
  text-align: center;
  color: #606266;
}
.error-area {
    color: var(--el-color-danger);
}
.page-hint {
    font-size: 14px;
    color: #909399;
    margin-bottom: 20px;
}

.blocks-container {
    /* Add styling if needed */
}

.homepage-block-item {
  margin-bottom: 20px;
  padding: 20px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
}

.dynamic-list-actions {
  display: flex;
  flex-direction: column; /* Stack buttons vertically */
  align-items: center; /* Center buttons horizontally */
  justify-content: center; 
  gap: 10px; /* Space between buttons */
  padding-top: 15px; /* Align with inputs roughly */
}

.block-actions .el-button {
    margin-left: 0 !important; /* Override default button margins if needed */
}

.add-block-section {
    margin-top: 20px;
    text-align: center;
}

/* Adjust label alignment if needed */
:deep(.el-form-item__label) {
    /* Example: Adjust label styles */
}

</style> 