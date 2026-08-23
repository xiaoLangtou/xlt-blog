<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { blogApi } from '@/api/blog'
  import StorageConfigFields from './StorageConfigFields.vue'

  type DisplayMode = 'cards' | 'list'

  const defaultConfig = (): Api.Blog.StorageConfig => ({
    active: 'local',
    local: { publicUrlPrefix: '/uploads' },
    rusfs: { endpoint: '', bucket: '', accessKey: '', secretKey: '', region: '', pathStyle: true, publicUrlBase: '' },
    s3: { provider: 'aws', endpoint: '', bucket: '', accessKey: '', secretKey: '', region: '', pathStyle: false, publicUrlBase: '' }
  })

  const form = reactive<Api.Blog.StorageConfig>(defaultConfig())
  const displayMode = ref<DisplayMode>('cards')
  const selectedBackend = ref<Api.Blog.StorageBackend>('local')
  const expandedBackend = ref<Api.Blog.StorageBackend>('local')
  const loading = ref(false)
  const saving = ref(false)
  const testing = ref(false)
  const migrating = ref(false)
  const failuresVisible = ref(false)
  const migrationResult = ref<Api.Blog.StorageMigrationResult | null>(null)
  const credentialDirty = reactive({ rusfsAccessKey: false, rusfsSecretKey: false, s3AccessKey: false, s3SecretKey: false })

  const backendCards: Array<{ value: Api.Blog.StorageBackend; title: string; shortTitle: string; description: string; icon: string }> = [
    { value: 'local', title: '本地存储', shortTitle: '本地存储', description: '文件保存在服务器本地磁盘，部署简单，无需额外依赖。', icon: 'ri:folder-3-line' },
    { value: 'rusfs', title: '本地 RustFS 存储', shortTitle: 'RustFS', description: '通过自建 RustFS 服务统一管理文件，支持独立部署与扩容。', icon: 'ri:server-line' },
    { value: 's3', title: '云服务商对象存储', shortTitle: '对象存储', description: '对接阿里云 OSS、腾讯云 COS、华为云 OBS、AWS S3 等。', icon: 'ri:cloud-line' }
  ]
  const s3Providers: Array<{ label: string; value: Api.Blog.StorageS3Provider }> = [
    { label: 'Amazon S3', value: 'aws' }, { label: '华为云 OBS', value: 'huawei-obs' }, { label: '阿里云 OSS', value: 'aliyun-oss' }, { label: '腾讯云 COS', value: 'tencent-cos' }, { label: '其他兼容服务', value: 'custom' }
  ]
  const selectedMeta = computed(() => backendCards.find((backend) => backend.value === selectedBackend.value))
  const activeMeta = computed(() => backendCards.find((backend) => backend.value === form.active))

  function resetCredentialDirty() {
    credentialDirty.rusfsAccessKey = false
    credentialDirty.rusfsSecretKey = false
    credentialDirty.s3AccessKey = false
    credentialDirty.s3SecretKey = false
  }
  function markCredentialDirty(field: keyof typeof credentialDirty) { credentialDirty[field] = true }
  function buildConfig(active = form.active): Api.Blog.StorageConfigInput {
    return {
      active,
      local: { ...form.local },
      rusfs: { ...form.rusfs, accessKey: credentialDirty.rusfsAccessKey ? form.rusfs.accessKey : '', secretKey: credentialDirty.rusfsSecretKey ? form.rusfs.secretKey : '' },
      s3: { ...form.s3, accessKey: credentialDirty.s3AccessKey ? form.s3.accessKey : '', secretKey: credentialDirty.s3SecretKey ? form.s3.secretKey : '' }
    }
  }
  function selectBackend(backend: Api.Blog.StorageBackend) { selectedBackend.value = backend; expandedBackend.value = backend }
  function handleCollapseChange(value: unknown) { if (typeof value === 'string' && backendCards.some((backend) => backend.value === value)) selectBackend(value as Api.Blog.StorageBackend) }
  function isCurrent(backend: Api.Blog.StorageBackend) { return form.active === backend }

  async function load() {
    loading.value = true
    try { Object.assign(form, await blogApi.getStorageConfig()); selectedBackend.value = form.active; expandedBackend.value = form.active; resetCredentialDirty() } finally { loading.value = false }
  }

  function validateSelectedConfig(): boolean {
    if (selectedBackend.value === 'local') return true
    const config = form[selectedBackend.value]
    const fields: Array<[keyof Api.Blog.StorageRemoteConfig, string]> = [['bucket', '存储桶'], ['accessKey', 'Access Key'], ['secretKey', 'Secret Key']]
    if (selectedBackend.value === 'rusfs' || (selectedBackend.value === 's3' && form.s3.provider === 'custom')) fields.unshift(['endpoint', '服务端点'])
    for (const [field, label] of fields) {
      if (!config[field]) { ElMessage.error(`请填写${label}`); return false }
    }
    return true
  }

  async function save(activate = false) {
    if (!validateSelectedConfig()) return
    const backend = selectedBackend.value
    saving.value = true
    try {
      await blogApi.updateStorageConfig(buildConfig(activate ? backend : form.active))
      if (activate) form.active = backend
      ElMessage.success(activate ? '已设为当前存储' : '存储配置已保存')
      await load(); selectedBackend.value = backend; expandedBackend.value = backend
    } finally { saving.value = false }
  }
  async function activateBackend(backend: Api.Blog.StorageBackend) { selectBackend(backend); await nextTick(); await save(true) }
  async function testConnection() {
    if (!validateSelectedConfig()) return
    testing.value = true
    try {
      const result = await blogApi.testStorageConfig(buildConfig(selectedBackend.value))
      result.success ? ElMessage.success(result.message || '连接测试成功') : ElMessage.error(result.message || '连接测试失败，请检查配置')
    } finally { testing.value = false }
  }
  async function migrateAttachments() {
    await ElMessageBox.confirm(`将把现有附件复制到当前启用的存储「${activeMeta.value?.title ?? '当前存储'}」。已成功迁移的附件会跳过，是否继续？`, '迁移现有附件', { confirmButtonText: '开始迁移', cancelButtonText: '取消', type: 'warning' })
    migrating.value = true
    try {
      migrationResult.value = await blogApi.migrateStorage()
      const { total, migrated, failed } = migrationResult.value
      if (failed) { ElMessage.warning(`迁移完成：共 ${total} 个，成功 ${migrated} 个，失败 ${failed} 个`); failuresVisible.value = true }
      else ElMessage.success(`迁移完成：${total} 个附件已迁移`)
    } finally { migrating.value = false }
  }
  onMounted(load)
</script>

<template>
  <div v-loading="loading" class="storage-page art-full-height">
    <ElCard class="art-table-card storage-card">
      <template #header>
        <div class="storage-card__header">
          <div class="storage-card__title">
            <h2>媒体存储</h2>
            <p>配置媒体文件的保存位置，并在切换前验证连接。</p>
          </div>
          <ElRadioGroup v-model="displayMode" aria-label="配置展示方式">
            <ElRadioButton label="cards"><ArtSvgIcon icon="ri:layout-grid-line" />卡片式</ElRadioButton>
            <ElRadioButton label="list"><ArtSvgIcon icon="ri:list-unordered" />列表式</ElRadioButton>
          </ElRadioGroup>
        </div>
      </template>

      <div class="storage-card__body">
        <template v-if="displayMode === 'cards'">
          <div class="storage-backend-grid">
            <button
              v-for="backend in backendCards"
              :key="backend.value"
              type="button"
              class="storage-tile"
              :class="{ 'is-selected': selectedBackend === backend.value }"
              role="radio"
              :aria-checked="selectedBackend === backend.value"
              @click="selectBackend(backend.value)"
            >
              <span class="storage-tile__radio"><ArtSvgIcon :icon="selectedBackend === backend.value ? 'ri:checkbox-circle-fill' : 'ri:checkbox-blank-circle-line'" /></span>
              <span class="storage-tile__icon"><ArtSvgIcon :icon="backend.icon" /></span>
              <strong>{{ backend.title }}</strong>
              <span class="storage-tile__desc">{{ backend.description }}</span>
              <ElTag v-if="isCurrent(backend.value)" type="primary" effect="plain" size="small">当前使用</ElTag>
            </button>
          </div>

          <section class="storage-panel">
            <div class="storage-panel__head">
              <span class="storage-panel__icon"><ArtSvgIcon :icon="selectedMeta?.icon" /></span>
              <div class="storage-panel__title">
                <h3>{{ selectedMeta?.title }}配置</h3>
                <p>填写连接信息后可先测试，再决定是否设为当前存储。</p>
              </div>
              <ElTag :type="isCurrent(selectedBackend) ? 'primary' : 'info'" effect="plain" size="small">{{ isCurrent(selectedBackend) ? '当前使用' : '未启用' }}</ElTag>
            </div>
            <p class="storage-key-note">密钥字段显示为脱敏内容；未编辑的密钥保存时会保留原值。</p>
            <StorageConfigFields :backend="selectedBackend" :config="form" :s3-providers="s3Providers" @credential-dirty="markCredentialDirty" />
            <div class="storage-actions">
              <ElButton type="primary" :loading="saving" @click="() => save()">保存配置</ElButton>
              <ElButton :loading="testing" @click="testConnection">测试连接</ElButton>
              <ElButton v-if="!isCurrent(selectedBackend)" :loading="saving" @click="activateBackend(selectedBackend)">设为当前存储</ElButton>
            </div>
          </section>
        </template>

        <ElCollapse v-else v-model="expandedBackend" accordion class="storage-list" @change="handleCollapseChange">
          <ElCollapseItem v-for="backend in backendCards" :key="backend.value" :name="backend.value">
            <template #title>
              <div class="storage-list__head">
                <span class="storage-list__icon" :class="{ 'is-current': isCurrent(backend.value) }"><ArtSvgIcon :icon="backend.icon" /></span>
                <span class="storage-list__content">
                  <span><strong>{{ backend.title }}</strong><ElTag :type="isCurrent(backend.value) ? 'primary' : 'info'" effect="plain" size="small">{{ isCurrent(backend.value) ? '当前使用' : '未启用' }}</ElTag></span>
                  <small>{{ backend.description }}</small>
                </span>
              </div>
            </template>
            <div class="storage-list__body">
              <p class="storage-key-note">密钥字段显示为脱敏内容；未编辑的密钥保存时会保留原值。</p>
              <StorageConfigFields :backend="backend.value" :config="form" :s3-providers="s3Providers" @credential-dirty="markCredentialDirty" />
              <div class="storage-actions">
                <ElButton type="primary" :loading="saving && selectedBackend === backend.value" @click="selectBackend(backend.value); save()">保存配置</ElButton>
                <ElButton :loading="testing && selectedBackend === backend.value" @click="selectBackend(backend.value); testConnection()">测试连接</ElButton>
                <ElButton v-if="!isCurrent(backend.value)" :loading="saving && selectedBackend === backend.value" @click="activateBackend(backend.value)">设为当前存储</ElButton>
              </div>
            </div>
          </ElCollapseItem>
        </ElCollapse>

        <section v-if="form.active !== 'local'" class="storage-migration">
          <div class="storage-migration__info">
            <h3>迁移已有附件</h3>
            <p>将已关联的本地附件复制到当前启用的{{ activeMeta?.title }}。已成功迁移的附件会自动跳过。</p>
          </div>
          <div class="storage-migration__action">
            <ElProgress v-if="migrating" :indeterminate="true" :show-text="false" />
            <ElButton type="warning" :loading="migrating" :disabled="migrating" @click="migrateAttachments">迁移现有附件</ElButton>
          </div>
        </section>
      </div>
    </ElCard>

    <ElDialog v-model="failuresVisible" title="迁移失败项" width="min(760px, 92vw)">
      <ElTable :data="migrationResult?.failures ?? []" max-height="420">
        <ElTableColumn prop="id" label="附件 ID" width="100" />
        <ElTableColumn prop="filename" label="文件名" min-width="180" />
        <ElTableColumn prop="error" label="失败原因" min-width="280" />
      </ElTable>
    </ElDialog>
  </div>
</template>

<style scoped>
  .storage-page { display: flex; flex-direction: column; }
  .storage-card { display: flex; flex-direction: column; }
  .storage-card :deep(.el-card__body) { flex: 1; overflow: auto; padding: 20px; }

  .storage-card__header { display: flex; gap: 16px; align-items: center; justify-content: space-between; }
  .storage-card__title h2 { margin: 0; font-size: 16px; font-weight: 600; color: var(--art-gray-900); }
  .storage-card__title p { margin: 4px 0 0; color: var(--art-gray-500); font-size: 13px; }
  .storage-card__header :deep(.el-radio-button__inner) { display: inline-flex; gap: 6px; align-items: center; }

  .storage-backend-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .storage-tile { position: relative; display: flex; flex-direction: column; align-items: flex-start; min-height: 148px; padding: 16px; text-align: left; background: var(--default-box-color); border: 1px solid var(--default-border); border-radius: calc(var(--custom-radius) / 2 + 2px); cursor: pointer; transition: border-color .15s ease, background-color .15s ease; }
  .storage-tile:hover { border-color: color-mix(in srgb, var(--theme-color) 42%, var(--default-border)); }
  .storage-tile.is-selected { border-color: var(--theme-color); background: color-mix(in srgb, var(--theme-color) 4%, var(--default-box-color)); }
  .storage-tile__radio { position: absolute; top: 14px; right: 14px; color: var(--art-gray-400); font-size: 17px; }
  .storage-tile.is-selected .storage-tile__radio { color: var(--theme-color); }
  .storage-tile__icon, .storage-panel__icon, .storage-list__icon { display: grid; width: 36px; height: 36px; margin-bottom: 12px; color: var(--art-gray-600); background: var(--default-bg-color); border-radius: var(--el-border-radius-base); place-items: center; }
  .storage-tile__icon :deep(.art-svg-icon), .storage-panel__icon :deep(.art-svg-icon), .storage-list__icon :deep(.art-svg-icon) { font-size: 18px; }
  .storage-tile.is-selected .storage-tile__icon, .storage-list__icon.is-current, .storage-panel__icon { color: var(--theme-color); background: color-mix(in srgb, var(--theme-color) 10%, var(--default-bg-color)); }
  .storage-tile strong { margin-bottom: 5px; font-size: 14px; font-weight: 600; color: var(--art-gray-900); }
  .storage-tile__desc { color: var(--art-gray-500); font-size: 12px; line-height: 1.6; }
  .storage-tile :deep(.el-tag) { margin-top: 12px; }

  .storage-panel { margin-top: 16px; padding: 16px; border: 1px solid var(--default-border); border-radius: calc(var(--custom-radius) / 2 + 2px); }
  .storage-panel__head { display: flex; gap: 10px; align-items: center; }
  .storage-panel__icon { width: 32px; height: 32px; margin: 0; }
  .storage-panel__title { flex: 1; }
  .storage-panel__head h3 { margin: 0; font-size: 14px; font-weight: 600; color: var(--art-gray-900); }
  .storage-panel__head p { margin: 3px 0 0; color: var(--art-gray-500); font-size: 12px; line-height: 1.6; }
  .storage-key-note { margin: 16px 0 18px; color: var(--art-gray-500); font-size: 12px; }
  .storage-actions { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 16px; margin-top: 4px; border-top: 1px solid var(--default-border); }

  .storage-list { margin-top: 0; border: 1px solid var(--default-border); border-radius: calc(var(--custom-radius) / 2 + 2px); overflow: hidden; }
  .storage-list :deep(.el-collapse-item__header) { min-height: auto; padding: 0 16px; line-height: normal; background: var(--default-box-color); }
  .storage-list :deep(.el-collapse-item__content) { padding: 0 16px 16px 64px; }
  .storage-list__head { display: flex; flex: 1; gap: 12px; align-items: center; padding: 14px 0; }
  .storage-list__icon { flex: 0 0 auto; width: 34px; height: 34px; margin: 0; }
  .storage-list__content { display: grid; flex: 1; gap: 3px; min-width: 0; }
  .storage-list__content > span { display: flex; gap: 8px; align-items: center; }
  .storage-list__content strong { font-size: 14px; font-weight: 600; color: var(--art-gray-900); }
  .storage-list__content small { color: var(--art-gray-500); font-size: 12px; }

  .storage-migration { display: flex; gap: 24px; align-items: center; justify-content: space-between; margin-top: 16px; padding: 16px; border: 1px solid var(--default-border); border-radius: calc(var(--custom-radius) / 2 + 2px); }
  .storage-migration__info h3 { margin: 0; font-size: 14px; font-weight: 600; color: var(--art-gray-900); }
  .storage-migration__info p { margin: 3px 0 0; color: var(--art-gray-500); font-size: 12px; line-height: 1.6; }
  .storage-migration__action { min-width: 144px; }
  .storage-migration__action :deep(.el-progress) { margin-bottom: 9px; }

  @media (max-width: 760px) {
    .storage-card__header, .storage-migration { align-items: flex-start; flex-direction: column; }
    .storage-backend-grid { grid-template-columns: 1fr; }
    .storage-list :deep(.el-collapse-item__content) { padding-left: 16px; }
  }
</style>
