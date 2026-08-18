<script setup lang="ts">
  import {
    ElCascader,
    ElCheckbox,
    ElCheckboxGroup,
    ElDatePicker,
    ElForm,
    ElInput,
    ElInputNumber,
    ElInputTag,
    ElRadio,
    ElRadioGroup,
    ElRate,
    ElSelect,
    ElSlider,
    ElSwitch,
    ElTimePicker,
    ElTimeSelect,
    ElTreeSelect
  } from 'element-plus'
  import { Search } from '@element-plus/icons-vue'
  import { toRaw, type Component, type VNode } from 'vue'

  defineOptions({ name: 'SearchTable' })

  type SearchFieldType =
    | 'input'
    | 'inputTag'
    | 'number'
    | 'select'
    | 'switch'
    | 'checkbox'
    | 'checkboxgroup'
    | 'radiogroup'
    | 'date'
    | 'daterange'
    | 'datetime'
    | 'datetimerange'
    | 'rate'
    | 'slider'
    | 'cascader'
    | 'timepicker'
    | 'timeselect'
    | 'treeselect'

  export interface SearchTableOption {
    label: string
    value: string | number | boolean
    disabled?: boolean
    [key: string]: any
  }

  export interface SearchTableField {
    prop: string
    label: string | (() => VNode) | Component
    type?: SearchFieldType
    labelWidth?: string | number
    placeholder?: string
    options?: SearchTableOption[]
    props?: Record<string, any>
    slots?: Record<string, (() => any) | undefined>
    render?: Component | (() => VNode)
    hidden?: boolean
    span?: number
  }

  interface SanitizeOutputOptions {
    removeEmptyString: boolean
    removeEmptyArray: boolean
    removeEmptyObject: boolean
    removeEmptyRichText: boolean
    keepZero: boolean
    keepFalse: boolean
  }

  interface SearchTableProps {
    querySource: SearchTableField[]
    loading?: boolean
    labelPosition?: 'left' | 'right' | 'top'
    labelWidth?: string | number
    showReset?: boolean
    showSearch?: boolean
    disabledSearch?: boolean
    sanitizeOutput?: Partial<SanitizeOutputOptions>
  }

  const props = withDefaults(defineProps<SearchTableProps>(), {
    loading: false,
    labelPosition: 'left',
    labelWidth: undefined,
    showReset: true,
    showSearch: true,
    disabledSearch: false,
    sanitizeOutput: () => ({})
  })

  const emit = defineEmits<{
    reset: []
    search: [query: Record<string, any>]
  }>()

  const query = defineModel<Record<string, any>>('query', { required: true })
  const formRef = useTemplateRef<InstanceType<typeof ElForm>>('formRef')

  const componentMap: Record<SearchFieldType, Component> = {
    input: ElInput,
    inputTag: ElInputTag,
    number: ElInputNumber,
    select: ElSelect,
    switch: ElSwitch,
    checkbox: ElCheckbox,
    checkboxgroup: ElCheckboxGroup,
    radiogroup: ElRadioGroup,
    date: ElDatePicker,
    daterange: ElDatePicker,
    datetime: ElDatePicker,
    datetimerange: ElDatePicker,
    rate: ElRate,
    slider: ElSlider,
    cascader: ElCascader,
    timepicker: ElTimePicker,
    timeselect: ElTimeSelect,
    treeselect: ElTreeSelect
  }

  const cloneValue = <T>(value: T): T => {
    if (value instanceof Date) return new Date(value.getTime()) as T
    if (Array.isArray(value)) return value.map((item) => cloneValue(item)) as T

    if (value && typeof value === 'object') {
      return Object.entries(toRaw(value)).reduce<Record<string, unknown>>((result, [key, item]) => {
        result[key] = cloneValue(item)
        return result
      }, {}) as T
    }

    return value
  }

  const filterKeys = computed(() => props.querySource.map((field) => field.prop))
  const initialValues = ref<Record<string, any>>({})

  function syncInitialValues() {
    initialValues.value = filterKeys.value.reduce<Record<string, any>>((result, key) => {
      result[key] = cloneValue(query.value[key])
      return result
    }, {})
  }

  syncInitialValues()

  watch(() => filterKeys.value.join('|'), syncInitialValues)

  function getComponent(field: SearchTableField) {
    return field.render ?? componentMap[field.type ?? 'input']
  }

  function getFieldProps(field: SearchTableField) {
    const type = field.type ?? 'input'
    const placeholder =
      field.placeholder ??
      (type === 'select' ? `请选择${String(field.label)}` : `请输入${String(field.label)}`)

    return {
      clearable: type === 'input' || type === 'inputTag' || type === 'select',
      placeholder,
      ...(field.type === 'daterange' ? { type: 'daterange' } : {}),
      ...(field.type === 'datetime' ? { type: 'datetime' } : {}),
      ...(field.type === 'datetimerange' ? { type: 'datetimerange' } : {}),
      ...field.props
    }
  }

  function getFieldStyle(field: SearchTableField) {
    return field.span && field.span > 1 ? { gridColumn: `span ${field.span}` } : undefined
  }

  function isEmptyObject(value: unknown) {
    return (
      Object.prototype.toString.call(value) === '[object Object]' &&
      Object.keys(value as object).length === 0
    )
  }

  function getOutput() {
    const options: SanitizeOutputOptions = {
      removeEmptyString: true,
      removeEmptyArray: true,
      removeEmptyObject: true,
      removeEmptyRichText: true,
      keepZero: true,
      keepFalse: true,
      ...props.sanitizeOutput
    }

    return filterKeys.value.reduce<Record<string, any>>((result, key) => {
      const value = query.value[key]
      const isEmptyRichText =
        typeof value === 'string' && /^<p>\s*<br\s*\/?\s*>\s*<\/p>$/i.test(value)
      const shouldRemove =
        (options.removeEmptyString && value === '') ||
        (options.removeEmptyArray && Array.isArray(value) && value.length === 0) ||
        (options.removeEmptyObject && isEmptyObject(value)) ||
        (options.removeEmptyRichText && isEmptyRichText) ||
        (!options.keepZero && value === 0) ||
        (!options.keepFalse && value === false) ||
        value === undefined ||
        value === null

      if (!shouldRemove) result[key] = cloneValue(value)
      return result
    }, {})
  }

  async function handleSearch() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (valid === false) return
    emit('search', getOutput())
  }

  function reset() {
    filterKeys.value.forEach((key) => {
      query.value[key] = cloneValue(initialValues.value[key])
    })
    formRef.value?.clearValidate()
    emit('reset')
  }

  function validate(...args: any[]) {
    return formRef.value?.validate(...args)
  }

  defineExpose({ validate, reset, getOutput })
</script>

<template>
  <section class="search-table">
    <ElForm
      ref="formRef"
      :model="query"
      class="search-form"
      :label-position="props.labelPosition"
      :label-width="props.labelWidth"
      @submit.prevent="handleSearch"
    >
      <div class="search-fields">
        <ElFormItem
          v-for="field in props.querySource.filter((item) => !item.hidden)"
          :key="field.prop"
          :prop="field.prop"
          :style="getFieldStyle(field)"
        >
          <template #label>
            <component v-if="typeof field.label !== 'string'" :is="field.label" />
            <span v-else>{{ field.label }}</span>
          </template>
          <slot :name="field.prop" :field="field" :model-value="query[field.prop]">
            <component
              :is="getComponent(field)"
              :model-value="query[field.prop]"
              v-bind="getFieldProps(field)"
              @update:model-value="query[field.prop] = $event"
            >
              <template v-if="field.type === 'select' && field.options">
                <ElOption
                  v-for="option in field.options"
                  :key="String(option.value)"
                  v-bind="option"
                />
              </template>
              <template v-if="field.type === 'checkboxgroup' && field.options">
                <ElCheckbox
                  v-for="option in field.options"
                  :key="String(option.value)"
                  v-bind="option"
                />
              </template>
              <template v-if="field.type === 'radiogroup' && field.options">
                <ElRadio
                  v-for="option in field.options"
                  :key="String(option.value)"
                  v-bind="option"
                />
              </template>
              <template v-for="(slotFn, slotName) in field.slots" :key="slotName" #[slotName]>
                <component :is="slotFn" />
              </template>
            </component>
          </slot>
        </ElFormItem>
      </div>
      <div v-if="props.showReset || props.showSearch || $slots.actions" class="search-actions">
        <ElButton v-if="props.showReset" @click="reset">重置</ElButton>
        <ElButton
          v-if="props.showSearch"
          type="primary"
          native-type="submit"
          :loading="props.loading"
          :disabled="props.disabledSearch"
        >
          <ElIcon><Search /></ElIcon>查询
        </ElButton>
        <slot name="actions" />
      </div>
    </ElForm>
  </section>
</template>

<style scoped>
  .search-table {
    padding: 18px 20px;
    background: var(--default-box-color);
    border: 1px solid var(--default-border);
    border-radius: 8px;
  }

  .search-form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px 16px;
  }

  .search-fields {
    display: grid;
    flex: 1;
    grid-template-columns: repeat(auto-fit, minmax(220px, 280px));
    gap: 12px 16px;
    min-width: 0;
  }

  .search-table :deep(.el-form-item) {
    margin-bottom: 0;
  }

  .search-table :deep(.el-form-item__label) {
    padding-bottom: 6px;
    color: var(--art-gray-700);
    line-height: 20px;
  }

  .search-table :deep(.el-input),
  .search-table :deep(.el-select) {
    width: 100%;
  }

  .search-actions {
    display: flex;
    gap: 8px;
  }

  @media (width <= 640px) {
    .search-table {
      padding: 16px;
    }

    .search-form,
    .search-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .search-fields {
      grid-template-columns: 1fr;
    }

    .search-actions :deep(.el-button) {
      flex: 1;
    }
  }
</style>
