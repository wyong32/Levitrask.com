<template>
  <div class="admin-homepage-manager">
    <div class="main-header">
      <h2>后台首页内容管理</h2>
      <div> <!-- Wrap buttons -->
          <el-button type="success" @click="saveOrder" :loading="isReordering" :disabled="!orderChanged" style="margin-right: 10px;">
              <el-icon><Sort /></el-icon> 保存顺序
          </el-button>
          <el-button type="primary" @click="handleAddBlock">
            <el-icon><Plus /></el-icon> 添加新区块
          </el-button>
      </div>
    </div>
    <p class="page-hint">通过上下箭头调整区块顺序，调整后请点击"保存顺序"按钮。</p>

    <div v-if="isLoading" class="loading-area">加载中...</div>
    <div v-else-if="errorMessage" class="error-area">{{ errorMessage }}</div>

    <el-table v-else :data="homepageBlocks" style="width: 100%" row-key="id">
      <el-table-column prop="id" label="DB ID" width="80" header-align="center" align="center" />
      <el-table-column prop="block_id" label="区块 ID (锚点)" min-width="150" header-align="center" />
      <el-table-column label="导航标题 (EN)" min-width="150" header-align="center">
         <template #default="scope">
            {{ getTranslation(scope.row.translations, 'en', 'nav_title') || '-' }}
         </template>
      </el-table-column>
      <el-table-column label="内容预览 (EN)" min-width="200" header-align="center">
        <template #default="scope">
          <div class="html-preview" v-if="getTranslation(scope.row.translations, 'en', 'html_content')">
            {{ truncateHtml(getTranslation(scope.row.translations, 'en', 'html_content'), 100) }}
          </div>
          <span v-else>- 无内容 -</span>
        </template>
      </el-table-column>
       <el-table-column prop="display_order" label="顺序" width="80" header-align="center" align="center" />
      <el-table-column label="操作" width="180" fixed="right" header-align="center" align="center"> <!-- Increased width for horizontal groups -->
        <template #default="scope">
           <div class="action-buttons-horizontal-groups"> <!-- Wrapper for horizontal groups -->
             
             <div class="button-group-vertical"> <!-- Group for Edit/Delete -->
               <el-button size="small" @click="handleEditBlock(scope.row)" type="primary" plain>
                  <el-icon><Edit /></el-icon> 编辑
               </el-button>
               <el-button size="small" type="danger" @click="handleDeleteBlock(scope.row)">
                  <el-icon><Delete /></el-icon> 删除
               </el-button>
             </div>
             <div class="button-group-vertical"> <!-- Group for Up/Down -->
               <el-tooltip content="上移" placement="top">
                 <el-button
                   size="small"
                   @click="moveBlock(scope.$index, -1)"
                   :disabled="scope.$index === 0"
                   :icon="ArrowUpBold"
                   circle
                   plain
                 />
               </el-tooltip>
               <el-tooltip content="下移" placement="top">
                  <el-button
                    size="small"
                    @click="moveBlock(scope.$index, 1)"
                    :disabled="scope.$index === homepageBlocks.length - 1"
                    :icon="ArrowDownBold"
                    circle
                    plain
                  />
                </el-tooltip>
             </div>
           </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add/Edit Block Dialog (MODIFIED for fixed languages) -->
    <el-dialog
      :title="isEditing ? '编辑首页区块' : '添加首页区块'"
      v-model="dialogVisible"
      width="70%"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form :model="blockForm" :rules="formRules" ref="blockFormRef" label-width="auto" label-position="top">
         <el-form-item label="区块 ID (Block ID)" prop="block_id" :rules="formRules.block_id">
           <el-input v-model="blockForm.block_id" placeholder="用于页面内锚点链接, 只能小写字母/数字/连字符" :disabled="isEditing"/>
           <div class="form-tip">此 ID 用于左侧导航和页面内跳转。创建后不建议修改。如需修改请联系开发。</div>
         </el-form-item>

         <el-divider content-position="left">语言翻译内容</el-divider>

         <!-- Language Tabs (Now fixed based on supportedLanguages) -->
         <el-tabs type="border-card" class="language-tabs">
            <el-tab-pane
              v-for="(translation, index) in blockForm.translations" 
              :key="translation.language_code"
              :label="supportedLanguages.find(l => l.code === translation.language_code)?.name || translation.language_code"
              :name="translation.language_code"
            >
              <!-- Removed the close button from tab label -->

              <!-- Form items for the current language -->
              <el-form-item
                :label="`导航标题 (Nav Title) - ${translation.language_code}`"
                :prop="`translations.${index}.nav_title`"
                :rules="[{ required: true, message: '导航标题不能为空', trigger: 'blur' }]"
              >
                <el-input v-model="translation.nav_title" :placeholder="`输入 ${translation.language_code} 的导航标题`" />
         </el-form-item>
              <el-form-item
                :label="`内容 (HTML) - ${translation.language_code}`"
                :prop="`translations.${index}.html_content`"
              >
                 <!-- No required rule for HTML content -->
            <el-input
              type="textarea"
                  v-model="translation.html_content"
              :rows="15"
                  :placeholder="`输入 ${translation.language_code} 的 HTML 内容 (可为空)`"
            />
         </el-form-item>
            </el-tab-pane>
         </el-tabs>

      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelForm">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="isSubmitting">
            {{ isEditing ? '保存更改' : '确认添加' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Section for Homepage Sidebar Management (MODIFIED to Table + Dialog) -->
    <el-divider content-position="left" style="margin-top: 40px;">
       <h2>首页右侧边栏管理</h2>
    </el-divider>
    <p class="page-hint">添加、编辑、删除和排序首页右侧边栏显示的区块。完成后点击"保存侧边栏"按钮。</p>

    <div class="sidebar-header">
        <el-button type="primary" @click="handleAddSidebarBlock">
           <el-icon><Plus /></el-icon> 添加侧边栏区块
        </el-button>
        <el-button type="success" @click="saveSidebarData" :loading="isSidebarSubmitting" :disabled="!isSidebarDataChanged">
            <el-icon><Check /></el-icon> 保存侧边栏
         </el-button>
    </div>

    <div v-if="isSidebarLoading" class="loading-area">侧边栏数据加载中...</div>
    <div v-else-if="sidebarErrorMessage" class="error-area">{{ sidebarErrorMessage }}</div>
    <div v-else>
        <el-table :data="sidebarData" style="width: 100%" row-key="$index"> <!-- Use index as key for non-persistent items -->
            <el-table-column label="#" width="60" header-align="center" align="center">
                 <template #default="scope">{{ scope.$index + 1 }}</template>
            </el-table-column>
            <el-table-column label="标题预览 (EN)" min-width="200" header-align="center">
                <template #default="scope">
                    {{ scope.row.title && scope.row.title[DEFAULT_LANG] ? scope.row.title[DEFAULT_LANG] : '-' }}
                </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right" header-align="center" align="center">
                 <template #default="scope">
                     <el-button size="small" @click="handleEditSidebarBlock(scope.row, scope.$index)" type="primary" plain>
                         <el-icon><Edit /></el-icon> 编辑
                     </el-button>
                     <el-button size="small" type="danger" @click="handleDeleteSidebarBlock(scope.$index)">
                         <el-icon><Delete /></el-icon> 删除
                     </el-button>
                     <!-- Add Up/Down arrows if reordering is needed -->
                 </template>
            </el-table-column>
        </el-table>
        <p v-if="!sidebarData || sidebarData.length === 0" style="text-align: center; color: #999; margin-top: 20px;">暂无侧边栏区块。</p>
    </div>

    <!-- Add/Edit Sidebar Block Dialog -->
    <el-dialog
      :title="isEditingSidebarBlock ? '编辑侧边栏区块' : '添加侧边栏区块'"
      v-model="sidebarDialogVisible"
      width="60%"
      :close-on-click-modal="false"
      @closed="resetSidebarForm"
    >
      <!-- Form structure similar to main block dialog -->
      <el-form :model="sidebarBlockForm" ref="sidebarBlockFormRef" label-width="auto" label-position="top">
         <el-tabs type="border-card" class="language-tabs">
            <el-tab-pane
              v-for="(lang) in supportedLanguages" 
              :key="lang.code"
              :label="lang.name"
              :name="lang.code"
            >
              <!-- Form items for the current language -->
               <el-form-item :label="`标题 (${lang.name})`">
                  <el-input v-model="sidebarBlockForm.title[lang.code]" :placeholder="`标题 - ${lang.name}`" />
                   </el-form-item>
               <el-form-item :label="`内容 HTML (${lang.name})`" :rules="[{ required: lang.code === DEFAULT_LANG, message: '默认语言内容不能为空', trigger: 'blur' }]" :prop="`html_content.${lang.code}`">
                      <el-input
                        type="textarea"
                    v-model="sidebarBlockForm.html_content[lang.code]"
                    :rows="10"
                    :placeholder="`HTML 内容 - ${lang.name}`"
                      />
                   </el-form-item>
            </el-tab-pane>
         </el-tabs>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelSidebarForm">取消</el-button>
          <el-button type="primary" @click="submitSidebarBlockForm" :loading="isSidebarBlockSubmitting">
            {{ isEditingSidebarBlock ? '保存更改' : '确认添加' }}
            </el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch, computed } from 'vue'; // Added watch and computed
import axios from 'axios';
// Added Sort, ArrowUpBold, ArrowDownBold icons
import { ElMessage, ElMessageBox, ElButton, ElInput, ElFormItem, ElRow, ElCol, ElDivider, ElDialog, ElForm, ElTable, ElTableColumn, ElIcon, ElTooltip, ElTabs, ElTabPane, ElSelect, ElOption } from 'element-plus';
import { Plus, Delete, Edit, Sort, ArrowUpBold, ArrowDownBold, Check } from '@element-plus/icons-vue';
import { cloneDeep } from 'lodash-es'; // Import cloneDeep for watching order changes

// --- State ---
const homepageBlocks = ref([]);
const originalOrderIds = ref([]); // Store original order for change detection
const isLoading = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);
const dialogVisible = ref(false);
const isEditing = ref(false);
const editingBlockId = ref(null);
const blockFormRef = ref(null);
const isReordering = ref(false); // Loading state for save order button
const orderChanged = ref(false); // Track if order has changed
const originalBlockData = ref(null); // Store original block data for comparison on edit

// --- State for Sidebar (MODIFIED for Table+Dialog) ---
const sidebarData = ref([]);
const originalSidebarData = ref([]); // To track changes for enabling save button
const sidebarId = ref(null);
const isSidebarLoading = ref(false);
const sidebarErrorMessage = ref('');
const isSidebarSubmitting = ref(false); // For the main save button
const isSidebarDataChanged = ref(false); // Track changes to enable save button
const HOMEPAGE_IDENTIFIER = 'home';

// --- State for Sidebar Dialog ---
const sidebarDialogVisible = ref(false);
const isEditingSidebarBlock = ref(false);
const editingSidebarBlockIndex = ref(-1); // Index in sidebarData array
const sidebarBlockFormRef = ref(null);
const isSidebarBlockSubmitting = ref(false); // Loading state for dialog submit
const sidebarBlockForm = reactive({
    title: {},
    html_content: {}
});

// --- Dialog Form Data & Rules (RESTRUCTURED for multi-language) ---
const blockForm = reactive({
  id: null, // DB ID of the block (used for editing)
  block_id: '', // The unique string identifier
  translations: [], // Array of { language_code: string, nav_title: string, html_content: string | null }
});

// Rules might need adjustment, applied dynamically within the template now
// const formRules = reactive({...}); // Keep block_id rule, apply translation rules dynamically
const formRules = reactive({
  block_id: [
    { required: true, message: '区块 ID 不能为空', trigger: 'blur' },
    { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'ID 只能包含小写字母、数字和连字符', trigger: 'blur' }
  ],
  // Translation rules will be applied per tab
});

// --- API Setup ---
const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const api = axios.create({ baseURL: baseUrl });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin-auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
     console.warn("Admin token not found in localStorage for API request.");
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// --- Fetch Data ---
const fetchHomepageBlocks = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  orderChanged.value = false;
  try {
    const response = await api.get('/admin/homepage/homepage-blocks');
    homepageBlocks.value = response.data || [];
    originalOrderIds.value = homepageBlocks.value.map(block => block.id);
    console.log('Fetched homepage blocks:', homepageBlocks.value);
  } catch (error) {
    console.error("Error fetching homepage blocks:", error);
    errorMessage.value = error.response?.data?.message || '加载首页布局失败';
    ElMessage.error(errorMessage.value);
  } finally {
    isLoading.value = false;
  }
};

// --- Fetch Sidebar Data (MODIFIED to store original data) ---
const fetchSidebarData = async () => {
  isSidebarLoading.value = true;
  sidebarErrorMessage.value = '';
  sidebarId.value = null;
  sidebarData.value = [];
  originalSidebarData.value = []; // Reset original data as well
  isSidebarDataChanged.value = false; // Reset change flag
  try {
    const response = await api.get('sidebars/admin');
    const sidebars = response.data || [];
    const homeSidebar = sidebars.find(s => s.page_identifier === HOMEPAGE_IDENTIFIER);

    if (homeSidebar) {
      sidebarId.value = homeSidebar.id;
      const sidebarContentRaw = homeSidebar.sidebar_content;

      if (Array.isArray(sidebarContentRaw)) {
         const processedData = sidebarContentRaw.map(block => {
             let titleObj = {};
             let contentObj = {};
             if (block && typeof block.title === 'string') {
                 titleObj[DEFAULT_LANG] = block.title;
             } else if (block && typeof block.title === 'object' && block.title !== null) {
                 titleObj = block.title;
             }
             if (block && typeof block.html_content === 'string') {
                 contentObj[DEFAULT_LANG] = block.html_content;
             } else if (block && typeof block.html_content === 'object' && block.html_content !== null) {
                 contentObj = block.html_content;
             }
              const normalizedBlock = {
                  title: titleObj,
                  html_content: contentObj
              };
              supportedLanguages.value.forEach(lang => {
                  if (!(lang.code in normalizedBlock.title)) { 
                      normalizedBlock.title[lang.code] = '';
                  }
                  if (!(lang.code in normalizedBlock.html_content)) { 
                      normalizedBlock.html_content[lang.code] = '';
                  }
              });
              return normalizedBlock;
          });
          sidebarData.value = processedData;
          originalSidebarData.value = cloneDeep(processedData); // Store initial state after processing
      } else {
          console.warn("Sidebar content fetched is not an array or is null:", sidebarContentRaw);
          sidebarData.value = [];
          originalSidebarData.value = [];
      }
      console.log(`Found homepage sidebar config (ID: ${sidebarId.value}):`, sidebarData.value);
    } else {
      console.log(`No sidebar configuration found for page identifier '${HOMEPAGE_IDENTIFIER}'. Ready to create.`);
      sidebarData.value = [];
      originalSidebarData.value = [];
    }
  } catch (error) {
    console.error("Error fetching sidebar data:", error);
    sidebarErrorMessage.value = error.response?.data?.message || '加载侧边栏数据失败';
    // Display more specific error message if available
    if (error.response?.data?.message) {
        ElMessage.error(`侧边栏数据加载失败: ${error.response.data.message}`);
    } else if (error.message) {
         // Handle the specific TypeError we encountered
        if (error instanceof TypeError && error.message.includes('Cannot create property')) {
             ElMessage.error('侧边栏数据格式错误，请检查并重新保存。可能包含旧的单语言格式。');
             // Optionally clear the problematic data to prevent further errors?
             // sidebarData.value = []; 
        } else {
            ElMessage.error(`侧边栏数据加载失败: ${error.message}`);
        }
    } else {
         ElMessage.error('加载侧边栏数据时发生未知错误。');
    }
  } finally {
    isSidebarLoading.value = false;
  }
};

// --- Watch for order changes ---
watch(homepageBlocks, (newBlocks) => {
  if (isLoading.value) return;
  const currentOrderIds = newBlocks.map(block => block.id);
  orderChanged.value = JSON.stringify(currentOrderIds) !== JSON.stringify(originalOrderIds.value);
}, { deep: true });

// Watch sidebarData for changes to enable save button
watch(sidebarData, (newData) => {
  if (isSidebarLoading.value || isSidebarSubmitting.value) return; // Don't trigger during load/save
  isSidebarDataChanged.value = JSON.stringify(newData) !== JSON.stringify(originalSidebarData.value);
}, { deep: true });

// --- Helper Functions ---
const truncateHtml = (htmlString, maxLength) => {
  if (!htmlString) return '';
  const text = htmlString.replace(/<[^>]*>/g, '');
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// --- Block Manipulation ---
const moveBlock = (index, direction) => {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= homepageBlocks.value.length) {
    return;
  }
  const itemToMove = homepageBlocks.value.splice(index, 1)[0];
  homepageBlocks.value.splice(newIndex, 0, itemToMove);
  console.log('Moved block, new order:', homepageBlocks.value.map(b => b.id));
};

// --- Dialog and Form Handling ---
const handleAddBlock = () => {
  resetForm();
  // Initialize form with empty translations for ALL supported languages
  blockForm.translations = supportedLanguages.value.map(lang => ({
      language_code: lang.code,
      nav_title: '',
      html_content: ''
  }));
  isEditing.value = false;
  editingBlockId.value = null;
  dialogVisible.value = true;
};

const handleEditBlock = (block) => {
  resetForm();
  originalBlockData.value = cloneDeep(block); // Store original data
  isEditing.value = true;
  editingBlockId.value = block.id;
  blockForm.id = block.id;
  blockForm.block_id = block.block_id;

  // Populate form with existing translations, filling gaps for supported languages
  const existingTranslations = block.translations || [];
  blockForm.translations = supportedLanguages.value.map(lang => {
      const existing = existingTranslations.find(t => t.language_code === lang.code);
      return existing ? cloneDeep(existing) : {
          language_code: lang.code,
          nav_title: '', // Default to empty if no translation exists yet
          html_content: '' // Default to empty
      };
  });

  dialogVisible.value = true;
};

const handleDeleteBlock = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除区块 "${row.nav_title}" (ID: ${row.block_id}) 吗？`,
      '确认删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    );
    try {
      await api.delete(`/admin/homepage/homepage-blocks/${row.id}`); 
      ElMessage.success('区块删除成功！');
      fetchHomepageBlocks();
    } catch (error) {
        console.error(`Error deleting block ${row.id}:`, error);
        ElMessage.error(`删除失败: ${error.response?.data?.message || error.message}`);
    }
  } catch (e) {
    if (e !== 'cancel') {
       console.error("Delete confirmation error:", e);
    }
  }
};

const submitForm = async () => {
  if (!blockFormRef.value) return;

  blockFormRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.error('请检查区块 ID 是否符合要求。');
      return;
    }

    let translationsValid = true;
    if (!blockForm.translations || blockForm.translations.length === 0) {
        translationsValid = false;
        ElMessage.error('至少需要添加一种语言的翻译。');
        return;
    }
    for (const trans of blockForm.translations) {
        if (!trans.nav_title || trans.nav_title.trim() === '') {
            translationsValid = false;
            ElMessage.error(`语言 [${trans.language_code}] 的导航标题不能为空。`);
            break;
        }
    }
    if (!translationsValid) return;

      isSubmitting.value = true;
      errorMessage.value = '';

      try {
        if (isEditing.value) {
        console.log('Updating block:', blockForm.id, blockForm);
        await updateBlockAndTranslations();
          ElMessage.success('区块更新成功！');
        } else {
        console.log('Creating block:', blockForm);
        await createBlockWithTranslations();
        ElMessage.success('区块添加成功！');
        }
        dialogVisible.value = false;
      await fetchHomepageBlocks();
      } catch (error) {
      console.error("Error saving block:", error);
      errorMessage.value = error.response?.data?.message || (isEditing.value ? '更新失败' : '添加失败');
      // Display specific error if available, fallback otherwise
      if (error.response?.data?.message) {
          ElMessage.error(`操作失败: ${error.response.data.message}`);
      } else if (error.message) {
          ElMessage.error(`操作失败: ${error.message}`);
      } else {
          ElMessage.error('发生未知错误，请稍后重试。');
      }
      } finally {
        isSubmitting.value = false;
    }
  });
};

const cancelForm = () => {
  dialogVisible.value = false;
  resetForm();
};

const resetForm = () => {
  blockForm.id = null;
  blockForm.block_id = '';
  blockForm.translations = [];
  originalBlockData.value = null; // Reset original data
  if (blockFormRef.value) {
    blockFormRef.value.resetFields();
  }
};

// --- Actual API Calls ---
const createBlockWithTranslations = async () => {
    // Filter out any potentially invalid translations just in case (though less likely now)
    const validTranslations = blockForm.translations.filter(t => t.language_code && typeof t.language_code === 'string');
    if (validTranslations.length === 0) {
       throw new Error("没有找到包含有效语言代码的翻译内容进行保存。");
    }
    const payload = {
        block_id: blockForm.block_id.trim(),
        translations: validTranslations.map(t => ({ // Send only valid translations
            language_code: t.language_code,
            nav_title: t.nav_title.trim(),
            html_content: t.html_content
        }))
    };
    console.log("POST /admin/homepage-blocks payload:", payload);
    await api.post('/admin/homepage-blocks', payload);
};

const updateBlockAndTranslations = async () => {
    const blockDbId = blockForm.id;
    if (!blockDbId) { // No need to check originalBlockData here for basic update
        throw new Error("无法更新：缺少区块 ID。");
    }
    const updatePromises = [];
    // Update/Insert each translation via the dedicated endpoint
    // blockForm.translations now always contains entries for all supported languages
    blockForm.translations.forEach(t => {
        const translationPayload = {
            nav_title: t.nav_title.trim(),
            html_content: t.html_content
        };
        // Only send update if nav_title is not empty? Optional refinement.
        // if (translationPayload.nav_title) { 
           console.log(`PUT /admin/homepage-blocks/${blockDbId}/translations/${t.language_code} payload:`, translationPayload);
           updatePromises.push(
               api.put(`/admin/homepage-blocks/${blockDbId}/translations/${t.language_code}`, translationPayload)
           );
        // }
    });
    // Deletion logic is still omitted as per previous decision
    await Promise.all(updatePromises);
    console.log(`Block ${blockDbId} translations updated.`);
};

// --- Save Order ---
const saveOrder = async () => {
    if (!orderChanged.value) {
        ElMessage.info("顺序未改变。");
        return;
    }
    isReordering.value = true;
    errorMessage.value = '';
    try {
        const currentOrderedIds = homepageBlocks.value.map(block => block.id);
        console.log("Saving new order:", currentOrderedIds);
        await api.put('/admin/homepage-blocks/reorder', { orderedIds: currentOrderedIds });
        ElMessage.success("顺序保存成功！");
        orderChanged.value = false;
        await fetchHomepageBlocks(); // Re-fetch to update display_order shown in table and reset originalOrderIds
    } catch (error) {
        console.error("Error saving block order:", error);
        errorMessage.value = error.response?.data?.message || '保存顺序失败';
        ElMessage.error(errorMessage.value);
    } finally {
        isReordering.value = false;
    }
};

// --- Sidebar Block Dialog Functions --- 
const resetSidebarForm = () => {
    // Reset form data by iterating through supported languages
    sidebarBlockForm.title = {};
    sidebarBlockForm.html_content = {};
    supportedLanguages.value.forEach(lang => {
        sidebarBlockForm.title[lang.code] = '';
        sidebarBlockForm.html_content[lang.code] = '';
    });
    editingSidebarBlockIndex.value = -1;
    if (sidebarBlockFormRef.value) {
        // Clear validation? Might need more specific handling for dynamic props
        // sidebarBlockFormRef.value.resetFields(); 
        sidebarBlockFormRef.value.clearValidate(); 
    }
};

const handleAddSidebarBlock = () => {
    resetSidebarForm(); // Initialize with empty fields for all languages
    isEditingSidebarBlock.value = false;
    sidebarDialogVisible.value = true;
};

const handleEditSidebarBlock = (blockData, index) => {
    resetSidebarForm();
    isEditingSidebarBlock.value = true;
    editingSidebarBlockIndex.value = index;
    // Deep clone the data from the table row into the form
    Object.assign(sidebarBlockForm.title, cloneDeep(blockData.title || {}));
    Object.assign(sidebarBlockForm.html_content, cloneDeep(blockData.html_content || {}));
    // Ensure all supported languages exist in the form
     supportedLanguages.value.forEach(lang => {
         if (!(lang.code in sidebarBlockForm.title)) { 
             sidebarBlockForm.title[lang.code] = '';
         }
         if (!(lang.code in sidebarBlockForm.html_content)) { 
             sidebarBlockForm.html_content[lang.code] = '';
         }
     });
    sidebarDialogVisible.value = true;
};

const handleDeleteSidebarBlock = async (index) => {
   try {
      await ElMessageBox.confirm(
          `确定要删除侧边栏区块 #${index + 1} 吗？`, 
          '确认删除', 
          { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
      );
  sidebarData.value.splice(index, 1);
      ElMessage.success('侧边栏区块已移除 (请记得点击"保存侧边栏"以应用更改)');
      // Note: This only removes from the local array. Actual deletion happens on saveSidebarData.
   } catch (e) { /* User cancelled */ }
};

const submitSidebarBlockForm = async () => {
    if (!sidebarBlockFormRef.value) return;
    
    isSidebarBlockSubmitting.value = true;
    try {
        // Validate form - particularly the default language content
        // Note: ElForm validation might be tricky with dynamic props. Manual check might be needed.
        let isValid = true;
        if (!sidebarBlockForm.html_content[DEFAULT_LANG] || sidebarBlockForm.html_content[DEFAULT_LANG].trim() === '') {
            isValid = false;
            ElMessage.error(`默认语言 (${DEFAULT_LANG}) 的内容不能为空。`);
        }
        // Add more validation if needed

        if (!isValid) {
             isSidebarBlockSubmitting.value = false;
            return; 
        }

        const blockDataToSave = cloneDeep({
            title: sidebarBlockForm.title,
            html_content: sidebarBlockForm.html_content
        });

        if (isEditingSidebarBlock.value && editingSidebarBlockIndex.value !== -1) {
            // Update existing block in the array
            sidebarData.value.splice(editingSidebarBlockIndex.value, 1, blockDataToSave);
        } else {
            // Add new block to the array
            sidebarData.value.push(blockDataToSave);
        }
        sidebarDialogVisible.value = false;
         ElMessage.success(`侧边栏区块已${isEditingSidebarBlock.value ? '更新' : '添加'} (请记得点击"保存侧边栏"以应用更改)`);
    } catch (error) { 
        console.error("Error submitting sidebar block form:", error);
        ElMessage.error('处理侧边栏区块时出错。');
    } finally {
         isSidebarBlockSubmitting.value = false;
    }
};

const cancelSidebarForm = () => {
    sidebarDialogVisible.value = false;
    // No need to call resetSidebarForm here, as @closed on dialog does it
};

// --- Save Sidebar Data (Main Save Button) ---
const saveSidebarData = async () => {
  if (!isSidebarDataChanged.value) {
      ElMessage.info('侧边栏内容未发生更改。');
      return;
  }
  isSidebarSubmitting.value = true;
  sidebarErrorMessage.value = '';

  // --- Validation (Example: Check default lang content for all blocks) ---
  let validationPassed = true;
  for (const [index, block] of sidebarData.value.entries()) {
      if (!block.html_content[DEFAULT_LANG] || block.html_content[DEFAULT_LANG].trim() === '') {
         ElMessage.error(`侧边栏区块 #${index + 1} 的 ${DEFAULT_LANG} 内容不能为空。`);
         validationPassed = false;
         break;
      }
  }

  if (!validationPassed) {
     isSidebarSubmitting.value = false;
     return;
  }

  // Payload remains the same - the modified sidebarData array
  const payload = {
    page_identifier: HOMEPAGE_IDENTIFIER,
    sidebar_content: sidebarData.value,
  };

  try {
    let response;
    if (sidebarId.value) {
      console.log(`Updating sidebar config ID: ${sidebarId.value}`);
      response = await api.put(`sidebars/admin/${sidebarId.value}`, payload);
      ElMessage.success('首页侧边栏更新成功！');
    } else {
      console.log(`Creating new sidebar config for page: ${HOMEPAGE_IDENTIFIER}`);
      response = await api.post('sidebars/admin', payload);
      sidebarId.value = response.data?.id;
      ElMessage.success('首页侧边栏创建成功！');
    }
    // After successful save, re-fetch to update originalSidebarData and reset change flag
    await fetchSidebarData(); 

  } catch (error) {
    console.error("Error saving sidebar data:", error);
    sidebarErrorMessage.value = error.response?.data?.message || '保存侧边栏数据失败';
    ElMessage.error(sidebarErrorMessage.value);
  } finally {
    isSidebarSubmitting.value = false;
  }
};

// --- Lifecycle Hook ---
onMounted(() => {
  fetchHomepageBlocks();
  fetchSidebarData(); // Fetch sidebar data on mount
});

// --- Utility Functions ---
// NEW Utility function to get specific translation field
const getTranslation = (translations, langCode, field) => {
  if (!Array.isArray(translations)) return null;
  const translation = translations.find(t => t.language_code === langCode);
  return translation ? translation[field] : null;
};

// --- State for Language Support ---
const supportedLanguages = ref([ // Ensure this is defined
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '简体中文' },
  // { code: 'es', name: 'Español' }, // Keep Spanish removed if desired
]);
const DEFAULT_LANG = 'en'; // Define default lang, ensure consistency

</script>

<style scoped>
.admin-homepage-manager {
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
.html-preview {
    max-height: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.85em;
    color: #6c757d;
    background-color: #f8f9fa;
    padding: 5px;
    border-radius: 3px;
    border: 1px solid #dee2e6;
    white-space: pre-wrap;
    word-break: break-all;
}
.form-tip {
    font-size: 0.85em;
    color: #999;
    margin-top: 4px;
}
.dialog-footer {
  text-align: right;
}
.page-hint {
    font-size: 14px;
    color: #909399;
    margin-bottom: 20px;
}
.el-table .cell .el-tooltip__trigger + .el-button {
    margin-left: 8px;
}
.el-table .cell .el-button + .el-button {
    margin-left: 0;
}
.dynamic-list-item {
  border: 1px solid #eee;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 4px;
  background-color: #fdfdfd;
}
.dynamic-list-actions {
  display: flex;
  align-items: center; /* Center button vertically */
  justify-content: center;
}
.sidebar-block-item .dynamic-list-actions {
    /* Adjust alignment if needed, e.g., align to top */
    align-items: flex-start;
    padding-top: 30px; /* Add padding to align with form item labels */
}
/* Ensure Element Plus icons are sized correctly */
.el-icon {
  vertical-align: middle;
  margin-right: 5px;
}
.el-button .el-icon {
    margin-right: 5px;
}
.el-button.is-circle .el-icon {
    margin-right: 0;
}

/* Styles for horizontal groups of vertically aligned buttons */
.action-buttons-horizontal-groups {
  display: flex;
  justify-content: center; /* Center the groups */
  gap: 15px; /* Space between vertical groups */
}

.button-group-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px; /* Space between buttons in a vertical group */
  align-items: center; /* Center buttons horizontally */
}

.el-table th {
  background-color: #f5f7fa; /* Optional: Header background */
}

/* Add styles for the language tabs and add button */
.language-tabs {
  margin-top: 20px;
  margin-bottom: 20px;
}

.add-language-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

/* Styles for sidebar management section */
.sidebar-block-item {
    border: 1px solid #eee;
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 4px;
    background-color: #fdfdfd;
}

.sidebar-block-actions {
    display: flex;
    align-items: center; /* Vertically center delete button */
    justify-content: center; /* Horizontally center delete button */
}

.sidebar-buttons-container {
    margin-top: 20px;
    text-align: right; /* Align buttons to the right */
}

.dynamic-list-item .el-form-item {
    margin-bottom: 10px; /* Reduce bottom margin for items within list */
}
.dynamic-list-actions .el-button {
    margin-top: 32px; /* Align delete button roughly with the second form item */
}

/* Add styles for the language groups within sidebar blocks */
.language-group {
  margin-bottom: 15px; /* Space between language groups */
  padding: 10px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background-color: #fcfcfc;
}
.language-group:last-child {
    margin-bottom: 0;
}

.sidebar-block-item h4 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 1.1em;
    color: #303133;
}

.sidebar-header {
  display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

/* Remove old sidebar specific styles if not needed */
.sidebar-block-item {
    /* Removed border/padding - now handled by table rows */
}
.language-group {
    /* Removed - now using tabs in dialog */
}
.sidebar-block-actions {
    /* Removed - now part of table actions column */
}
.sidebar-buttons-container {
   /* Removed - Buttons moved to sidebar-header */
}

</style>