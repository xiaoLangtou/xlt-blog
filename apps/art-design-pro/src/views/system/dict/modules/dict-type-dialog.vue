<template>
  <ElDialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增字典类型' : '编辑字典类型'"
    width="480px"
    align-center
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElFormItem label="字典名称" prop="dictName">
        <ElInput v-model="form.dictName" placeholder="请输入字典名称" />
      </ElFormItem>
      <ElFormItem label="字典编码" prop="dictCode">
        <ElInput v-model="form.dictCode" placeholder="请输入字典编码" :disabled="dialogType === 'edit'" />
      </ElFormItem>
      <ElFormItem label="系统内置" prop="systemFlag">
        <ElRadioGroup v-model="form.systemFlag">
          <ElRadio value="Y">是</ElRadio>
          <ElRadio value="N">否</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="备注" prop="dictDesc">
        <ElInput v-model="form.dictDesc" type="textarea" :rows="3" placeholder="请输入备注" />
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
  import { useAddDictTypeMutation, useUpdateDictTypeMutation } from '@/hooks/queries/useDictQuery'

  type IDictType = Api.Dict.IDictType

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    dictData?: IDictType
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

  const defaultForm = (): Api.Dict.DictTypeFormParams => ({
    dictName: '',
    dictCode: '',
    systemFlag: 'N',
    dictDesc: ''
  })

  const form = reactive(defaultForm())

  const rules = reactive<FormRules>({
    dictName: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
    dictCode: [{ required: true, message: '请输入字典编码', trigger: 'blur' }],
    systemFlag: [{ required: true, message: '请选择是否系统内置', trigger: 'change' }]
  })

  watch(
    () => props.modelValue,
    (val) => {
      if (val && props.dialogType === 'edit' && props.dictData) {
        Object.assign(form, {
          dictName: props.dictData.dictName ?? '',
          dictCode: props.dictData.dictCode ?? '',
          systemFlag: props.dictData.systemFlag ?? 'N',
          dictDesc: props.dictData.dictDesc ?? ''
        })
      }
    }
  )

  const addMutation = useAddDictTypeMutation()
  const updateMutation = useUpdateDictTypeMutation()

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
