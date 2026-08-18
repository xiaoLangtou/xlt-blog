<!-- 岗位编辑弹窗 -->
<template>
  <ElDialog
    :model-value="visible"
    :title="title"
    width="460px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
    @open="handleOpen"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <div class="post-dialog-grid">
        <ElFormItem label="岗位名称" prop="name">
          <ElInput v-model="form.name" placeholder="请输入岗位名称" maxlength="30" />
        </ElFormItem>
        <ElFormItem label="岗位编码" prop="code">
          <ElInput v-model="form.code" placeholder="如: ceo" maxlength="30" />
        </ElFormItem>
      </div>
      <div class="post-dialog-grid">
        <ElFormItem label="排序号" prop="sortOrder">
          <ElInputNumber v-model="form.sortOrder" :min="0" :max="9999" class="w-full" />
        </ElFormItem>
        <ElFormItem label="状态" prop="status">
          <div class="post-status-toggle">
            <ElSwitch v-model="form.status" :active-value="1" :inactive-value="0" />
            <span class="post-status-label">{{ form.status === 1 ? '启用' : '停用' }}</span>
          </div>
        </ElFormItem>
      </div>
      <ElFormItem label="备注" prop="description">
        <ElInput
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
          maxlength="100"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="$emit('update:visible', false)">取消</ElButton>
      <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { useAddPostMutation, useEditPostMutation } from '@/hooks/queries/usePostQuery'

  interface Props {
    visible: boolean
    type: 'add' | 'edit'
    postData?: Api.Post.IPost
  }

  interface Emits {
    (e: 'update:visible', val: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const submitLoading = ref(false)

  const title = computed(() => (props.type === 'add' ? '新增岗位' : '编辑岗位'))

  const defaultForm = (): Api.Post.PostFormParams => ({
    name: '',
    code: '',
    sortOrder: 0,
    description: '',
    status: 1
  })

  const form = reactive<Api.Post.PostFormParams>(defaultForm())

  const rules: FormRules = {
    name: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
    code: [{ required: true, message: '请输入岗位编码', trigger: 'blur' }],
    sortOrder: [{ required: true, message: '请输入排序值', trigger: 'blur' }]
  }

  const addPost = useAddPostMutation()
  const editPost = useEditPostMutation()

  function handleOpen() {
    if (props.type === 'edit' && props.postData) {
      Object.assign(form, {
        name: props.postData.name ?? '',
        code: props.postData.code ?? '',
        sortOrder: props.postData.sortOrder ?? 0,
        description: props.postData.description ?? '',
        status: props.postData.status ?? 1
      })
    } else {
      Object.assign(form, defaultForm())
    }
  }

  async function handleSubmit() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return

    submitLoading.value = true
    try {
      if (props.type === 'edit' && props.postData?.id) {
        editPost.mutate(
          { id: props.postData.id, ...form },
          {
            onSuccess: () => {
              ElMessage.success('更新成功')
              emit('success')
            },
            onSettled: () => { submitLoading.value = false }
          }
        )
      } else {
        addPost.mutate(form, {
          onSuccess: () => {
            ElMessage.success('创建成功')
            emit('success')
          },
          onSettled: () => { submitLoading.value = false }
        })
      }
    } catch {
      submitLoading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .post-dialog-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 14px;
  }

  .post-status-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 2px;
  }

  .post-status-label {
    font-size: 12.5px;
    color: var(--system-secondary, var(--art-gray-700));
  }

  .w-full {
    width: 100%;
  }
</style>
