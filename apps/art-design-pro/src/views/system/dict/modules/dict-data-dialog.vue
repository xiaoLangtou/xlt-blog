<template>
  <ElDialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增字典数据' : '编辑字典数据'"
    width="480px"
    align-center
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElFormItem label="字典标签" prop="dictLabel">
        <ElInput v-model="form.dictLabel" placeholder="请输入字典标签" />
      </ElFormItem>
      <ElFormItem label="字典值" prop="dictValue">
        <ElInput v-model="form.dictValue" placeholder="请输入字典值" />
      </ElFormItem>
      <ElFormItem label="排序" prop="dictSort">
        <ElInputNumber v-model="form.dictSort" :min="0" :max="9999" controls-position="right" />
      </ElFormItem>
      <ElFormItem label="备注" prop="dictRemark">
        <ElInput v-model="form.dictRemark" type="textarea" :rows="3" placeholder="请输入备注" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="addMutation.isPending.value || updateMutation.isPending.value" @click="handleSubmit">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { useAddDictDataMutation, useUpdateDictDataMutation } from '@/hooks/queries/useDictQuery'

  type IDictData = Api.Dict.IDictData

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    dictTypeId: number
    dictData?: IDictData
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    dictData: undefined
  })

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
  }>()

  const formRef = ref<FormInstance>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const defaultForm = (): Api.Dict.DictDataFormParams => ({
    dictLabel: '',
    dictValue: '',
    dictTypeId: props.dictTypeId,
    dictRemark: '',
    dictSort: 0
  })

  const form = reactive(defaultForm())

  const rules = reactive<FormRules>({
    dictLabel: [{ required: true, message: '请输入字典标签', trigger: 'blur' }],
    dictValue: [{ required: true, message: '请输入字典值', trigger: 'blur' }]
  })

  watch(
    () => props.modelValue,
    (val) => {
      if (val && props.dialogType === 'edit' && props.dictData) {
        Object.assign(form, {
          dictLabel: props.dictData.dictLabel ?? '',
          dictValue: props.dictData.dictValue ?? '',
          dictTypeId: props.dictData.dictTypeId ?? props.dictTypeId,
          dictRemark: props.dictData.dictRemark ?? '',
          dictSort: props.dictData.dictSort ?? 0
        })
      } else if (val) {
        form.dictTypeId = props.dictTypeId
      }
    }
  )

  const addMutation = useAddDictDataMutation()
  const updateMutation = useUpdateDictDataMutation()

  async function handleSubmit() {
    await formRef.value?.validate()
    const onSuccess = () => {
      ElMessage.success(props.dialogType === 'add' ? '新增成功' : '更新成功')
      handleClose()
    }
    if (props.dialogType === 'add') {
      addMutation.mutate(form, { onSuccess })
    } else {
      updateMutation.mutate({ ...form, id: props.dictData!.id! }, { onSuccess })
    }
  }

  function handleClose() {
    visible.value = false
    formRef.value?.resetFields()
    Object.assign(form, defaultForm())
  }
</script>
