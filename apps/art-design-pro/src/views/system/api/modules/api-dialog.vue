<!-- API 编辑弹窗 -->
<template>
  <ElDialog
    :model-value="visible"
    :title="title"
    width="500px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
    @open="handleOpen"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="接口路径" prop="path">
        <ElInput v-model="form.path" placeholder="请输入接口路径，如 /user/list" maxlength="200" />
      </ElFormItem>
      <ElFormItem label="请求方式" prop="method">
        <ElSelect v-model="form.method" placeholder="请选择请求方式" class="w-full">
          <ElOption
            v-for="m in methods"
            :key="m"
            :label="m"
            :value="m"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="接口描述" prop="description">
        <ElInput v-model="form.description" placeholder="请输入接口描述" maxlength="100" />
      </ElFormItem>
      <ElFormItem label="接口分组" prop="tags">
        <ElInput v-model="form.tags" placeholder="请输入接口分组" maxlength="50" />
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
  import { useAddApiMutation, useEditApiMutation } from '@/hooks/queries/useApiQuery'

  interface Props {
    visible: boolean
    type: 'add' | 'edit'
    apiData?: Api.ApiManage.IApi
  }

  interface Emits {
    (e: 'update:visible', val: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const submitLoading = ref(false)

  const title = computed(() => (props.type === 'add' ? '新增接口' : '编辑接口'))

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

  const defaultForm = (): Api.ApiManage.ApiFormParams => ({
    path: '',
    description: '',
    method: 'GET',
    apiGroup: ''
  })

  const form = reactive<Api.ApiManage.ApiFormParams>(defaultForm())

  const rules: FormRules = {
    path: [{ required: true, message: '请输入接口路径', trigger: 'blur' }],
    description: [{ required: true, message: '请输入接口描述', trigger: 'blur' }],
    method: [{ required: true, message: '请选择请求方式', trigger: 'change' }],
    tags: [{ required: true, message: '请输入接口分组', trigger: 'blur' }]
  }

  const addApi = useAddApiMutation()
  const editApi = useEditApiMutation()

  function handleOpen() {
    if (props.type === 'edit' && props.apiData) {
      Object.assign(form, {
        path: props.apiData.path ?? '',
        description: props.apiData.description ?? '',
        method: props.apiData.method ?? 'GET',
        apiGroup: props.apiData.apiGroup ?? '',
        tags: props.apiData.apiGroup ?? ''
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
      // 构建参数，将 tags 映射为 apiGroup
      const params = {
        path: form.path!,
        description: form.description!,
        method: form.method as Api.Common.HttpMethod,
        tags: form.tags!
      }

      if (props.type === 'edit' && props.apiData?.id) {
        editApi.mutate(
          { id: props.apiData.id, ...params },
          {
            onSuccess: () => {
              ElMessage.success('更新成功')
              emit('success')
            },
            onSettled: () => { submitLoading.value = false }
          }
        )
      } else {
        addApi.mutate(params, {
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
