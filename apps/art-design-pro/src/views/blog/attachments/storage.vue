<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { blogApi } from '@/api/blog'
import StorageConfigFields from './StorageConfigFields.vue'

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const editorVisible = ref(false)
const editingId = ref<string | null>(null)
const credentialDirty = ref(false)
const config = ref<Api.Blog.StorageConfig>({
  defaultTargetId: 'local',
  local: { publicUrlPrefix: '/uploads' },
  remotes: []
})

const s3Providers: Array<{ label: string; value: Api.Blog.StorageS3Provider }> = [
  { label: 'Amazon S3', value: 'aws' },
  { label: '华为云 OBS', value: 'huawei-obs' },
  { label: '阿里云 OSS', value: 'aliyun-oss' },
  { label: '腾讯云 COS', value: 'tencent-cos' },
  { label: '其他兼容服务', value: 'custom' }
]

const form = reactive<Api.Blog.StorageRemoteConfigInput>(createRemoteDraft())
const targets = computed(() => [
  { id: 'local', name: '本地存储', kind: 'local' as const },
  ...config.value.remotes
])

function createRemoteDraft(): Api.Blog.StorageRemoteConfigInput {
  return {
    name: '', kind: 'rusfs', provider: 'aws', endpoint: '', bucket: '', accessKey: '', secretKey: '',
    region: '', pathStyle: true, publicUrlBase: ''
  }
}

function resetDraft(remote?: Api.Blog.StorageRemoteConfig) {
  Object.assign(form, remote ? { ...remote } : createRemoteDraft())
  credentialDirty.value = false
}

async function load() {
  loading.value = true
  try {
    config.value = await blogApi.getStorageConfig()
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  resetDraft()
  editorVisible.value = true
}

function openEdit(remote: Api.Blog.StorageRemoteConfig) {
  editingId.value = remote.id
  resetDraft(remote)
  editorVisible.value = true
}

function messageRequired(label: string) {
  ElMessage.error(`请填写${label}`)
  return false
}

function validate(): boolean {
  if (!form.name.trim()) return messageRequired('配置名称')
  if (!form.bucket.trim()) return messageRequired('Bucket 名称')
  if ((form.kind === 'rusfs' || form.provider === 'custom') && !form.endpoint?.trim()) {
    return messageRequired('服务端点')
  }
  if (!editingId.value || credentialDirty.value) {
    if (!form.accessKey.trim()) return messageRequired('Access Key')
    if (!form.secretKey.trim()) return messageRequired('Secret Key')
  }
  return true
}

function payload(): Api.Blog.StorageRemoteConfigInput {
  return {
    ...form,
    accessKey: editingId.value && !credentialDirty.value ? '' : form.accessKey,
    secretKey: editingId.value && !credentialDirty.value ? '' : form.secretKey
  }
}

async function saveRemote() {
  if (!validate()) return
  saving.value = true
  try {
    if (editingId.value) {
      await blogApi.updateStorageRemote(editingId.value, payload())
      ElMessage.success('存储实例已更新')
    } else {
      await blogApi.createStorageRemote(payload())
      ElMessage.success('存储实例已新增')
    }
    editorVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function testRemote() {
  if (!validate()) return
  testing.value = true
  try {
    const result = await blogApi.testStorageConfig(payload(), editingId.value ?? undefined)
    result.success ? ElMessage.success(result.message) : ElMessage.error(result.message)
  } finally {
    testing.value = false
  }
}

async function setDefaultTarget(id: string) {
  if (id === config.value.defaultTargetId) return
  saving.value = true
  try {
    config.value = await blogApi.updateStorageConfig(id)
    ElMessage.success('默认上传存储已更新')
  } finally {
    saving.value = false
  }
}

async function removeRemote(remote: Api.Blog.StorageRemoteConfig) {
  await ElMessageBox.confirm(
    `确认删除存储实例「${remote.name}」？已关联附件的实例不能删除。`,
    '删除存储实例',
    { type: 'warning' }
  )
  await blogApi.deleteStorageRemote(remote.id)
  ElMessage.success('存储实例已删除')
  await load()
}

function kindLabel(kind: Api.Blog.StorageKind) {
  if (kind === 'local') return '本地存储'
  return kind === 'rusfs' ? 'RustFS' : '对象存储'
}

function kindIcon(kind: Api.Blog.StorageKind) {
  return kind === 'local' ? 'ri:folder-3-line' : kind === 'rusfs' ? 'ri:server-line' : 'ri:cloud-line'
}

onMounted(load)
</script>

<template>
  <div v-loading="loading" class="storage-page art-full-height">
    <ElCard class="art-table-card storage-card">
      <template #header>
        <div class="storage-card__header">
          <div>
            <h2>媒体存储</h2>
            <p>本地存储固定可用；每个对象存储实例都能独立用于上传和保留已有附件。</p>
          </div>
          <ElButton type="primary" @click="openCreate">
            <ArtSvgIcon icon="ri:add-line" />新增对象存储
          </ElButton>
        </div>
      </template>

      <section class="default-target">
        <div>
          <h3>默认上传存储</h3>
          <p>未手动指定目标的上传会写入此实例；设为默认不会停用其他实例。</p>
        </div>
        <ElSelect :model-value="config.defaultTargetId" :loading="saving" @update:model-value="setDefaultTarget">
          <ElOption v-for="target in targets" :key="target.id" :label="target.name" :value="target.id">
            <span>{{ target.name }}</span><small>（{{ kindLabel(target.kind) }}）</small>
          </ElOption>
        </ElSelect>
      </section>

      <section class="storage-list">
        <article class="storage-item storage-item--local">
          <div class="storage-item__icon">
            <ArtSvgIcon :icon="kindIcon('local')" />
          </div>
          <div class="storage-item__main">
            <div class="storage-item__title"><strong>本地存储</strong>
              <ElTag size="small" effect="plain">固定可用</ElTag>
            </div>
            <p>文件保存到应用的 uploads 目录，并通过 /uploads 对外访问。</p>
          </div>
          <ElTag v-if="config.defaultTargetId === 'local'" type="primary" size="small">默认上传</ElTag>
        </article>

        <article v-for="remote in config.remotes" :key="remote.id" class="storage-item">
          <div class="storage-item__icon">
            <ArtSvgIcon :icon="kindIcon(remote.kind)" />
          </div>
          <div class="storage-item__main">
            <div class="storage-item__title">
              <strong>{{ remote.name }}</strong>
              <ElTag size="small" effect="plain">{{ kindLabel(remote.kind) }}</ElTag>
              <ElTag v-if="config.defaultTargetId === remote.id" type="primary" size="small">默认上传</ElTag>
            </div>
            <p>{{ remote.bucket }}<template v-if="remote.endpoint"> · {{ remote.endpoint }}</template></p>
          </div>
          <div class="storage-item__actions">
            <ElButton size="small" @click="openEdit(remote)">编辑</ElButton>
            <ElButton size="small" type="danger" plain @click="removeRemote(remote)">删除</ElButton>
          </div>
        </article>
        <ElEmpty v-if="!config.remotes.length" description="尚未配置对象存储；本地存储可随时使用" />
      </section>
    </ElCard>

    <ElDialog v-model="editorVisible" :title="editingId ? '编辑对象存储' : '新增对象存储'" width="min(760px, 92vw)"
      destroy-on-close>
      <p class="storage-key-note">密钥字段显示为脱敏内容；编辑实例且未改动密钥时，会保留服务器中的原始凭据。</p>
      <StorageConfigFields :model="form" :s3-providers="s3Providers" :is-editing="Boolean(editingId)"
        @credential-dirty="credentialDirty = true" />
      <template #footer>
        <ElButton :loading="testing" @click="testRemote">测试连接</ElButton>
        <ElButton @click="editorVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="saveRemote">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.storage-page {
  display: flex;
  flex-direction: column;
}

.storage-card {
  display: flex;
  flex-direction: column;
}

.storage-card :deep(.el-card__body) {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.storage-card__header {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.storage-card__header h2,
.default-target h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--art-gray-900);
}

.storage-card__header p,
.default-target p {
  margin: 4px 0 0;
  color: var(--art-gray-500);
  font-size: 13px;
}

.default-target {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  margin-bottom: 16px;
  background: color-mix(in srgb, var(--theme-color) 4%, var(--default-box-color));
  border: 1px solid color-mix(in srgb, var(--theme-color) 24%, var(--default-border));
  border-radius: calc(var(--custom-radius) / 2 + 2px);
}

.default-target :deep(.el-select) {
  width: min(320px, 100%);
}

.storage-list {
  display: grid;
  gap: 12px;
}

.storage-item {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 16px;
  background: var(--default-box-color);
  border: 1px solid var(--default-border);
  border-radius: calc(var(--custom-radius) / 2 + 2px);
}

.storage-item--local {
  background: color-mix(in srgb, var(--theme-color) 3%, var(--default-box-color));
}

.storage-item__icon {
  display: grid;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  color: var(--theme-color);
  background: color-mix(in srgb, var(--theme-color) 10%, var(--default-bg-color));
  border-radius: var(--el-border-radius-base);
  place-items: center;
}

.storage-item__icon :deep(.art-svg-icon) {
  font-size: 19px;
}

.storage-item__main {
  flex: 1;
  min-width: 0;
}

.storage-item__title {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.storage-item__title strong {
  color: var(--art-gray-900);
  font-size: 14px;
}

.storage-item__main p {
  margin: 5px 0 0;
  overflow: hidden;
  color: var(--art-gray-500);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.storage-item__actions {
  display: flex;
  gap: 8px;
}

.storage-key-note {
  margin: 0 0 16px;
  color: var(--art-gray-500);
  font-size: 12px;
}

@media (max-width: 760px) {

  .storage-card__header,
  .default-target,
  .storage-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .default-target :deep(.el-select) {
    width: 100%;
  }

  .storage-item__actions {
    width: 100%;
  }
}
</style>
