<script setup lang="ts">
  const props = defineProps<{
    model: Api.Blog.StorageRemoteConfigInput
    s3Providers: Array<{ label: string; value: Api.Blog.StorageS3Provider }>
    isEditing?: boolean
  }>()

  const emit = defineEmits<{
    credentialDirty: []
  }>()

  function onCredentialInput() {
    emit('credentialDirty')
  }
</script>

<template>
  <ElForm label-position="top" class="storage-form">
    <div class="storage-field-grid">
      <ElFormItem label="配置名称" required>
        <ElInput v-model="props.model.name" placeholder="例如：生产 RustFS、阿里云备份桶" />
      </ElFormItem>
      <ElFormItem label="存储类型" required>
        <ElSelect v-model="props.model.kind" :disabled="isEditing">
          <ElOption label="RustFS（S3 兼容）" value="rusfs" />
          <ElOption label="对象存储" value="s3" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="props.model.kind === 's3'" label="服务商">
        <ElSelect v-model="props.model.provider">
          <ElOption v-for="provider in s3Providers" :key="provider.value" :label="provider.label" :value="provider.value" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="服务端点" :required="props.model.kind === 'rusfs' || props.model.provider === 'custom'">
        <ElInput v-model="props.model.endpoint" placeholder="http://127.0.0.1:9000 或 https://s3.example.com" />
      </ElFormItem>
      <ElFormItem label="Bucket 名称" required>
        <ElInput v-model="props.model.bucket" placeholder="xlt-blog-media" />
      </ElFormItem>
      <ElFormItem label="地域 (Region)">
        <ElInput v-model="props.model.region" placeholder="us-east-1" />
      </ElFormItem>
      <ElFormItem label="Access Key" required>
        <ElInput v-model="props.model.accessKey" placeholder="未编辑则保留原值" @input="onCredentialInput" />
      </ElFormItem>
      <ElFormItem label="Secret Key" required>
        <ElInput v-model="props.model.secretKey" type="password" show-password placeholder="未编辑则保留原值" @input="onCredentialInput" />
      </ElFormItem>
      <ElFormItem label="自定义域名 / CDN">
        <ElInput v-model="props.model.publicUrlBase" placeholder="https://cdn.example.com" />
      </ElFormItem>
    </div>
    <ElFormItem class="storage-switch-field" label="使用 Path-style 地址">
      <ElSwitch v-model="props.model.pathStyle" />
    </ElFormItem>
  </ElForm>
</template>

<style scoped>
  .storage-form :deep(.el-form-item) { margin-bottom: 16px; }
  .storage-form :deep(.el-form-item__label) { padding-bottom: 6px; color: var(--el-text-color-regular); font-size: 13px; line-height: 1.2; }
  .storage-field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 18px; }
  .storage-field-grid :deep(.el-select) { width: 100%; }
  .storage-switch-field { margin-bottom: 0 !important; }
  @media (max-width: 760px) { .storage-field-grid { grid-template-columns: 1fr; } }
</style>
