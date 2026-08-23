<script setup lang="ts">
  defineProps<{
    backend: Api.Blog.StorageBackend
    config: Api.Blog.StorageConfig
    s3Providers: Array<{ label: string; value: Api.Blog.StorageS3Provider }>
  }>()

  const emit = defineEmits<{
    credentialDirty: [field: 'rusfsAccessKey' | 'rusfsSecretKey' | 's3AccessKey' | 's3SecretKey']
  }>()
</script>

<template>
  <ElForm label-position="top" class="storage-form">
    <template v-if="backend === 'local'">
      <ElFormItem label="访问 URL 前缀">
        <ElInput v-model="config.local.publicUrlPrefix" placeholder="/uploads" />
        <div class="field-help">附件对外访问时使用的 URL 前缀。</div>
      </ElFormItem>
    </template>

    <template v-else-if="backend === 'rusfs'">
      <div class="storage-field-grid">
        <ElFormItem label="RustFS 服务地址" required><ElInput v-model="config.rusfs.endpoint" placeholder="http://127.0.0.1:9010" /></ElFormItem>
        <ElFormItem label="Bucket 名称" required><ElInput v-model="config.rusfs.bucket" placeholder="blog-media" /></ElFormItem>
        <ElFormItem label="区域"><ElInput v-model="config.rusfs.region" placeholder="us-east-1" /></ElFormItem>
        <ElFormItem label="Access Key" required><ElInput v-model="config.rusfs.accessKey" placeholder="未编辑则保留原值" @input="emit('credentialDirty', 'rusfsAccessKey')" /></ElFormItem>
        <ElFormItem label="Secret Key" required><ElInput v-model="config.rusfs.secretKey" type="password" show-password placeholder="未编辑则保留原值" @input="emit('credentialDirty', 'rusfsSecretKey')" /></ElFormItem>
        <ElFormItem label="访问 URL 前缀"><ElInput v-model="config.rusfs.publicUrlBase" placeholder="https://blog.example.com/rusfs" /></ElFormItem>
      </div>
      <ElFormItem class="storage-switch-field" label="使用 Path-style 地址"><ElSwitch v-model="config.rusfs.pathStyle" /></ElFormItem>
    </template>

    <template v-else>
      <div class="storage-field-grid">
        <ElFormItem label="服务商"><ElSelect v-model="config.s3.provider"><ElOption v-for="provider in s3Providers" :key="provider.value" :label="provider.label" :value="provider.value" /></ElSelect></ElFormItem>
        <ElFormItem label="服务端点" :required="config.s3.provider === 'custom'"><ElInput v-model="config.s3.endpoint" placeholder="https://s3.example.com" /></ElFormItem>
        <ElFormItem label="Bucket 名称" required><ElInput v-model="config.s3.bucket" placeholder="xlt-blog-media" /></ElFormItem>
        <ElFormItem label="地域 (Region)"><ElInput v-model="config.s3.region" placeholder="cn-north-4" /></ElFormItem>
        <ElFormItem label="Access Key" required><ElInput v-model="config.s3.accessKey" placeholder="未编辑则保留原值" @input="emit('credentialDirty', 's3AccessKey')" /></ElFormItem>
        <ElFormItem label="Secret Key" required><ElInput v-model="config.s3.secretKey" type="password" show-password placeholder="未编辑则保留原值" @input="emit('credentialDirty', 's3SecretKey')" /></ElFormItem>
        <ElFormItem label="自定义域名 / CDN"><ElInput v-model="config.s3.publicUrlBase" placeholder="https://cdn.example.com" /></ElFormItem>
      </div>
      <ElFormItem class="storage-switch-field" label="使用 Path-style 地址"><ElSwitch v-model="config.s3.pathStyle" /></ElFormItem>
    </template>
  </ElForm>
</template>

<style scoped>
  .storage-form :deep(.el-form-item) { margin-bottom: 16px; }
  .storage-form :deep(.el-form-item__label) { padding-bottom: 6px; color: var(--el-text-color-regular); font-size: 13px; line-height: 1.2; }
  .storage-field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 18px; }
  .storage-field-grid :deep(.el-select) { width: 100%; }
  .storage-switch-field { margin-bottom: 0 !important; }
  .field-help { margin-top: 6px; color: var(--el-text-color-secondary); font-size: 12px; }
  @media (max-width: 760px) { .storage-field-grid { grid-template-columns: 1fr; } }
</style>
