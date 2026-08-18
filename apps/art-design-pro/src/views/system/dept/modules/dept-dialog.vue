<!-- 部门编辑弹窗 -->
<template>
  <ElDialog
    :model-value="visible"
    :title="title"
    width="560px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
    @open="handleOpen"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="上级部门" prop="parentId">
        <ElTreeSelect
          v-model="form.parentId"
          :data="treeOptions"
          :props="{ label: 'deptName', value: 'id', children: 'children' }"
          placeholder="请选择上级部门"
          check-strictly
          clearable
          class="w-full"
        />
      </ElFormItem>
      <ElFormItem label="部门名称" prop="deptName">
        <ElInput v-model="form.deptName" placeholder="请输入部门名称" maxlength="30" />
      </ElFormItem>
      <ElFormItem label="部门编码" prop="deptCode">
        <ElInput v-model="form.deptCode" placeholder="请输入部门编码" maxlength="30" />
      </ElFormItem>
      <ElFormItem label="部门全称" prop="fullName">
        <ElInput v-model="form.fullName" placeholder="请输入部门全称" maxlength="50" />
      </ElFormItem>
      <ElFormItem label="部门类型" prop="deptType">
        <ElSelect v-model="form.deptType" placeholder="请选择部门类型" class="w-full">
          <ElOption label="公司" value="COMPANY" />
          <ElOption label="部门" value="DEPT" />
          <ElOption label="小组" value="GROUP" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="排序" prop="orderNum">
        <ElInputNumber v-model="form.orderNum" :min="0" :max="9999" class="w-full" />
      </ElFormItem>
      <ElFormItem label="负责人" prop="leader">
        <ElInput v-model="form.leader" placeholder="请输入负责人" maxlength="20" />
      </ElFormItem>
      <ElFormItem label="联系电话" prop="phone">
        <ElInput v-model="form.phone" placeholder="请输入联系电话" maxlength="20" />
      </ElFormItem>
      <ElFormItem label="邮箱" prop="email">
        <ElInput v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
      </ElFormItem>
      <ElFormItem label="地址" prop="address">
        <ElInput v-model="form.address" placeholder="请输入地址" maxlength="100" />
      </ElFormItem>
      <ElFormItem label="邮政编码" prop="postalCode">
        <ElInput v-model="form.postalCode" placeholder="请输入邮政编码" maxlength="10" />
      </ElFormItem>
      <ElFormItem label="备注" prop="remark">
        <ElInput v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" maxlength="255" />
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
  import { useAddDeptMutation, useEditDeptMutation } from '@/hooks/queries/useDeptQuery'

  interface Props {
    visible: boolean
    type: 'add' | 'edit'
    deptData?: Api.Dept.IDept
    deptTree: Api.Dept.IDept[]
  }

  interface Emits {
    (e: 'update:visible', val: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const submitLoading = ref(false)

  const title = computed(() => (props.type === 'add' ? '新增部门' : '编辑部门'))

  const defaultForm = (): Api.Dept.DeptFormParams => ({
    deptName: '',
    deptCode: '',
    fullName: '',
    deptType: 'DEPT',
    orderNum: 0,
    parentId: 0,
    leader: '',
    phone: '',
    email: '',
    address: '',
    postalCode: '',
    remark: ''
  })

  const form = reactive<Api.Dept.DeptFormParams>(defaultForm())

  const rules: FormRules = {
    deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
    deptCode: [{ required: true, message: '请输入部门编码', trigger: 'blur' }],
    fullName: [{ required: true, message: '请输入部门全称', trigger: 'blur' }],
    deptType: [{ required: true, message: '请选择部门类型', trigger: 'change' }],
    orderNum: [{ required: true, message: '请输入排序', trigger: 'blur' }]
  }

  // 过滤掉当前节点及其子节点（编辑时避免选自己为父级）
  const treeOptions = computed(() => {
    if (props.type === 'edit' && props.deptData?.id) {
      return filterSelf(props.deptTree, props.deptData.id)
    }
    return [{ id: 0, deptName: '顶级部门', children: props.deptTree } as Api.Dept.IDept]
  })

  function filterSelf(tree: Api.Dept.IDept[], selfId: number): Api.Dept.IDept[] {
    return tree
      .filter((item) => item.id !== selfId)
      .map((item) => ({
        ...item,
        children: item.children ? filterSelf(item.children, selfId) : undefined
      }))
  }

  const addDept = useAddDeptMutation()
  const editDept = useEditDeptMutation()

  function handleOpen() {
    if (props.type === 'edit' && props.deptData) {
      Object.assign(form, {
        deptName: props.deptData.deptName ?? '',
        deptCode: props.deptData.deptCode ?? '',
        fullName: props.deptData.fullName ?? '',
        deptType: props.deptData.deptType ?? 'DEPT',
        orderNum: props.deptData.orderNum ?? 0,
        parentId: props.deptData.parentId ?? 0,
        leader: props.deptData.leader ?? '',
        phone: props.deptData.phone ?? '',
        email: props.deptData.email ?? '',
        address: props.deptData.address ?? '',
        postalCode: props.deptData.postalCode ?? '',
        remark: props.deptData.remark ?? ''
      })
    } else if (props.type === 'add' && props.deptData) {
      // 新增子级，父级选中当前行
      Object.assign(form, defaultForm(), { parentId: props.deptData.id ?? 0 })
    } else {
      Object.assign(form, defaultForm())
    }
  }

  async function handleSubmit() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return

    submitLoading.value = true
    try {
      if (props.type === 'edit' && props.deptData?.id) {
        editDept.mutate(
          { id: props.deptData.id, ...form },
          {
            onSuccess: () => {
              ElMessage.success('更新成功')
              emit('success')
            },
            onSettled: () => {
              submitLoading.value = false
            }
          }
        )
      } else {
        addDept.mutate(form, {
          onSuccess: () => {
            ElMessage.success('创建成功')
            emit('success')
          },
          onSettled: () => {
            submitLoading.value = false
          }
        })
      }
    } catch {
      submitLoading.value = false
    }
  }
</script>
