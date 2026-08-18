<template>
  <ElDialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增角色' : '编辑角色'"
    width="480px"
    align-center
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top" class="role-form">
      <ElFormItem label="角色名称" prop="roleName">
        <ElInput v-model="form.roleName" placeholder="请输入角色名称" />
      </ElFormItem>
      <ElFormItem label="权限字符" prop="roleCode">
        <ElInput v-model="form.roleCode" placeholder="如: admin" class="mono-input" />
      </ElFormItem>
      <ElFormItem label="排序号">
        <ElInput v-model.number="form.sortOrder" type="number" placeholder="0" />
      </ElFormItem>
      <ElFormItem label="状态">
        <ElRadioGroup v-model="form.enabled">
          <ElRadio :value="true" size="large" border>启用</ElRadio>
          <ElRadio :value="false" size="large" border>停用</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="备注" prop="description">
        <ElInput v-model="form.description" type="textarea" :rows="3" placeholder="请输入备注信息" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" @click="handleSubmit">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { fetchAddRole, fetchEditRole } from '@/api/role'

type RoleListItem = Api.SystemManage.RoleListItem

interface Props {
  modelValue: boolean
  dialogType: 'add' | 'edit'
  roleData?: RoleListItem
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  dialogType: 'add',
  roleData: undefined
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const rules = reactive<FormRules>({
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  roleCode: [
    { required: true, message: '请输入权限字符', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
})

const form = reactive({
  roleName: '',
  roleCode: '',
  description: '',
  sortOrder: 0,
  enabled: true
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) initForm()
  }
)

const initForm = () => {
  if (props.dialogType === 'edit' && props.roleData) {
    form.roleName = props.roleData.roleName || ''
    form.roleCode = props.roleData.roleCode || ''
    form.description = props.roleData.description || ''
    form.sortOrder = 0
    form.enabled = props.roleData.enabled ?? true
  } else {
    form.roleName = ''
    form.roleCode = ''
    form.description = ''
    form.sortOrder = 0
    form.enabled = true
  }
}

const handleClose = () => {
  visible.value = false
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    const params: Api.Role.RoleFormParams = {
      roleName: form.roleName,
      roleCode: form.roleCode,
      description: form.description,
      sortOrder: form.sortOrder
    }

    if (props.dialogType === 'edit' && props.roleData) {
      await fetchEditRole({ ...params, id: props.roleData.roleId })
      ElMessage.success('角色修改成功')
    } else {
      await fetchAddRole(params)
      ElMessage.success('角色添加成功')
    }

    emit('success')
    handleClose()
  } catch (error) {
    if (error instanceof Error || (error && typeof error === 'object' && 'message' in error)) {
      // 表单验证错误由 Element Plus 自行处理
    } else {
      // API 错误由 http 工具统一处理
    }
  }
}
</script>

<style lang="scss" scoped>
.role-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }

  :deep(.el-form-item--label-top .el-form-item__label) {
    margin-bottom: 0;
  }

  :deep(.el-radio-group) {
    display: flex;
    gap: 12px;
    width: 100%;

    .el-radio {
      flex: 1;
      margin-right: 0;
    }
  }
}

.mono-input :deep(.el-input__inner) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

</style>
