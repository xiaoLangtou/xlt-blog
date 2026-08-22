<script setup lang="ts">
  import { VueFilesPreview } from 'vue-files-preview'
  import 'vue-files-preview/lib/style.css'

  interface Props {
    file: string | File
    filename?: string
    mimeType?: string
    width?: string | number
    height?: string | number
  }

  const props = withDefaults(defineProps<Props>(), {
    filename: '',
    mimeType: '',
    width: '100%',
    height: '500px'
  })

  const error = ref('')
  const loading = ref(true)

  // 判断文件是否支持预览
  function isSupportedFile(mimeType: string): boolean {
    const mt = (mimeType || '').toLowerCase()

    // 文档类型
    if (
      mt.includes('pdf') ||
      mt.includes('word') ||
      mt.includes('document') ||
      mt.includes('sheet') ||
      mt.includes('excel') ||
      mt.includes('presentation') ||
      mt.includes('powerpoint') ||
      mt.includes('msword') ||
      mt.includes('ms-excel') ||
      mt.includes('ms-powerpoint') ||
      mt.includes('officedocument') ||
      mt.includes('opendocument')
    ) {
      return true
    }

    // 文本类型
    if (
      mt.startsWith('text/') ||
      mt.includes('json') ||
      mt.includes('javascript') ||
      mt.includes('css') ||
      mt.includes('html') ||
      mt.includes('xml')
    ) {
      return true
    }

    // 媒体类型
    if (mt.startsWith('image/') || mt.startsWith('video/') || mt.startsWith('audio/')) {
      return true
    }

    // Markdown
    if (mt.includes('markdown') || props.filename.toLowerCase().endsWith('.md')) {
      return true
    }

    // EPUB
    if (mt.includes('epub')) {
      return true
    }

    return false
  }

  function onRendered() {
    loading.value = false
  }

  function onError(err: Error) {
    loading.value = false
    error.value = err.message || '文件加载失败'
  }
</script>

<template>
  <div class="file-preview" :style="{ width, height }">
    <div v-if="!isSupportedFile(mimeType)" class="preview-unsupported">
      <div class="unsupported-icon">
        <ArtSvgIcon icon="ri:file-forbid-line" />
      </div>
      <p class="unsupported-text">此文件类型不支持预览</p>
      <p class="unsupported-hint">{{ mimeType || '未知类型' }}</p>
    </div>
    <div v-else-if="error" class="preview-error">
      <div class="error-icon">
        <ArtSvgIcon icon="ri:error-warning-line" />
      </div>
      <p class="error-text">{{ error }}</p>
    </div>
    <div v-else class="preview-container">
      <div v-if="loading" class="preview-loading">
        <ElIcon class="is-loading">
          <Loading />
        </ElIcon>
        <p>加载中...</p>
      </div>
      <VueFilesPreview
        :url="typeof file === 'string' ? file : undefined"
        :file="typeof file !== 'string' ? file : undefined"
        :name="filename"
        @rendered="onRendered"
        @error="onError"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>


  .file-preview {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 400px;


  }

  .preview-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
      ::-webkit-scrollbar {
          height: 8px !important;
      }
  }





  .preview-loading {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    justify-content: center;
    background: #fff;
  }

  .preview-loading .el-icon {
    font-size: 32px;
    color: var(--theme-color);
  }

  .preview-loading p {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
  }

  .preview-unsupported,
  .preview-error {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 400px;
  }

  .unsupported-icon,
  .error-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    background: #f3f4f6;
    border-radius: 50%;
    color: #9ca3af;
  }

  .error-icon {
    background: #fef2f2;
    color: #ef4444;
  }

  .unsupported-icon :deep(.art-svg-icon),
  .error-icon :deep(.art-svg-icon) {
    font-size: 32px;
  }

  .unsupported-text,
  .error-text {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }

  .unsupported-hint {
    margin: 0;
    font-size: 14px;
    color: #9ca3af;
  }
</style>
