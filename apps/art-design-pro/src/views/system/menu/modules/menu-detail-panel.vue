<template>
  <div class="menu-detail-form">
    <div class="menu-panel-header menu-detail-header">
      <div class="menu-detail-header__main">
        <div class="menu-panel-title">
          <ArtSvgIcon :icon="isEditing ? 'ri:edit-line' : 'ri:file-list-3-line'" :size="15" />
          {{ panelTitle }}
        </div>
        <span class="menu-status-badge" :class="displayStatus ? 'is-on' : 'is-off'">
          <span class="menu-status-dot"></span>
          {{ displayStatus ? '启用' : '停用' }}
        </span>
      </div>

      <div class="menu-detail-header__actions">
        <template v-if="!isEditing">
          <ElButton v-if="panelState === 'view'"  @click="emit('edit')">
            <ArtSvgIcon icon="ri:edit-line" :size="13" class="mr-1" />
            编辑
          </ElButton>
          <ElButton
            v-if="panelState === 'view'"
           
            type="danger"
            plain
            @click="emit('delete')"
          >
            <ArtSvgIcon icon="ri:delete-bin-line" :size="13" class="mr-1" />
            删除
          </ElButton>
        </template>

        <template v-else>
          <ElButton @click="handleCancel">取消</ElButton>
          <ElButton type="primary" @click="handleSubmit">
            <ArtSvgIcon icon="ri:check-line" :size="13" class="mr-1" />
            保存
          </ElButton>
          <ElButton
            v-if="panelState === 'edit'"
            
            type="danger"
            plain
            @click="emit('delete')"
          >
            <ArtSvgIcon icon="ri:delete-bin-line" :size="13" class="mr-1" />
            删除
          </ElButton>
        </template>
      </div>
    </div>

    <!-- 详情查看 -->
    <div v-if="!isEditing" class="menu-detail-body">
      <div class="menu-detail-card">
        <div class="menu-form-section-title">基本信息</div>
        <div class="menu-detail-rows">
          <div v-for="item in basicViewItems" :key="item.label" class="menu-detail-row">
            <span class="menu-detail-row__label">{{ item.label }}</span>
            <span class="menu-detail-row__value">
              <span v-if="item.code" class="menu-code">{{ item.value }}</span>
              <span v-else-if="item.icon && getIconComp(iconDisplayName(item.icon))" class="inline-flex items-center gap-1.5">
                <component :is="getIconComp(iconDisplayName(item.icon))" :size="18" />
                <span class="menu-code">{{ iconDisplayName(item.icon) }}</span>
              </span>
              <span v-else>{{ item.value }}</span>
            </span>
          </div>
        </div>
      </div>

      <div v-if="showMenuSections" class="menu-detail-card">
        <div class="menu-form-section-title">路由配置</div>
        <div class="menu-detail-rows">
          <div v-for="item in routeViewItems" :key="item.label" class="menu-detail-row">
            <span class="menu-detail-row__label">{{ item.label }}</span>
            <span class="menu-detail-row__value">
              <span class="menu-code">{{ item.value }}</span>
            </span>
          </div>
        </div>
      </div>

      <div v-if="showMenuSections" class="menu-detail-card menu-detail-card--display">
        <div class="menu-form-section-title">显示配置</div>
        <div class="menu-display-switch-grid">
          <div
            v-for="item in displaySwitchItems"
            :key="item.label"
            class="menu-display-switch-card"
            :class="item.boolValue ? 'is-on' : 'is-off'"
          >
            <span class="menu-display-switch-card__dot"></span>
            <span class="menu-display-switch-card__label">{{ item.label }}</span>
            <span class="menu-display-switch-card__value">{{ item.value }}</span>
          </div>
        </div>
        <div v-if="displayTextItems.length" class="menu-display-extra">
          <div
            v-for="item in displayTextItems"
            :key="item.label"
            class="menu-display-extra__item"
          >
            <span class="menu-display-extra__label">{{ item.label }}</span>
            <span class="menu-display-extra__value">{{ item.value }}</span>
          </div>
        </div>
      </div>

      <div v-if="showButtonConfig" class="menu-detail-card menu-detail-card--button">
        <div class="menu-form-section-title">按钮配置</div>
        <ButtonConfigTable :items="authButtons" readonly />
      </div>
    </div>

    <!-- 编辑表单 -->
    <div v-else class="menu-detail-body">
      <div class="menu-detail-card">
        <div class="menu-form-section-title">基本信息</div>

        <ArtForm
          ref="formRef"
          v-model="form"
          :items="basicFormItems"
          :rules="rules"
          :span="width > 768 ? 12 : 24"
          :gutter="24"
          label-width="100px"
          :show-reset="false"
          :show-submit="false"
        />
      </div>

      <div v-if="showMenuSections" class="menu-detail-card">
        <div class="menu-form-section-title">路由配置</div>
        <ArtForm
          v-model="form"
          :items="routeFormItems"
          :span="width > 768 ? 12 : 24"
          :gutter="24"
          label-width="100px"
          :show-reset="false"
          :show-submit="false"
        />
      </div>

      <div v-if="showMenuSections" class="menu-detail-card menu-detail-card--display">
        <div class="menu-form-section-title">显示配置</div>

        <div class="menu-display-switch-grid menu-display-switch-grid--edit">
          <div
            v-for="item in displaySwitchFields"
            :key="item.key"
            class="menu-display-switch-card menu-display-switch-card--edit"
            :class="form[item.key] ? 'is-on' : 'is-off'"
          >
            <span class="menu-display-switch-card__label">{{ item.label }}</span>
            <ElSwitch v-model="form[item.key]" size="small" />
          </div>
        </div>

        <div class="menu-display-text-rows">
          <div class="menu-display-text-row">
            <span class="menu-display-text-row__label">
              激活路径
              <ElTooltip
                content="用于详情页等隐藏菜单，指定高亮显示的父级菜单路径"
                placement="top"
              >
                <ElIcon class="menu-display-text-row__tip"><QuestionFilled /></ElIcon>
              </ElTooltip>
            </span>
            <ElInput v-model="form.activePath" placeholder="如：/system/user" />
          </div>

          <div class="menu-display-text-row">
            <span class="menu-display-text-row__label">
              角色权限
              <ElTooltip
                content="仅用于前端权限模式：配置角色标识（如 R_SUPER、R_ADMIN）"
                placement="top"
              >
                <ElIcon class="menu-display-text-row__tip"><QuestionFilled /></ElIcon>
              </ElTooltip>
            </span>
            <ElInputTag v-model="form.roles" placeholder="输入角色标识后按回车" />
          </div>

          <div class="menu-display-text-row">
            <span class="menu-display-text-row__label">文本徽章</span>
            <ElInput v-model="form.showTextBadge" placeholder="如：New、Hot" />
          </div>
        </div>
      </div>

      <div v-if="showButtonConfig" class="menu-detail-card menu-detail-card--button">
        <div class="menu-form-section-title">按钮配置</div>
        <ButtonConfigTable
          v-model:items="form.authList"
          :readonly="false"
          @add="handleAddAuthButton"
          @remove="handleRemoveAuthButton"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { FormRules } from 'element-plus'
  import { ElIcon, ElTooltip } from 'element-plus'
  import { QuestionFilled } from '@element-plus/icons-vue'
  import { useWindowSize } from '@vueuse/core'
  import { icons } from 'lucide-vue-next'
  import { formatMenuTitle } from '@/utils/router'
  import { normalizeIcon } from '@/utils/ui/normalizeIcon'
  import type { AppRouteRecord } from '@/types/router'
  import type { FormItem } from '@/components/core/forms/art-form/index.vue'
  import ArtForm from '@/components/core/forms/art-form/index.vue'
  import MenuIconPicker from '@/components/core/forms/menu-icon-picker/index.vue'
  import ButtonConfigTable from './button-config-table.vue'

  defineOptions({ name: 'MenuDetailPanel' })

  interface AuthButtonItem {
    title: string
    authMark: string
    sort: number
  }

  interface MenuFormData {
    id: number
    parentName: string
    name: string
    path: string
    label: string
    component: string
    icon: string
    isEnable: boolean
    sort: number
    isMenu: boolean
    keepAlive: boolean
    isHide: boolean
    isHideTab: boolean
    link: string
    isIframe: boolean
    showBadge: boolean
    showTextBadge: string
    fixedTab: boolean
    activePath: string
    roles: string[]
    isFullPage: boolean
    authName: string
    authLabel: string
    authIcon: string
    authSort: number
    authList: AuthButtonItem[]
  }

  export type MenuSubmitData = MenuFormData

  interface Props {
    panelState: 'view' | 'add' | 'edit'
    editData?: AppRouteRecord | null
    type?: 'menu' | 'button'
    lockType?: boolean
    parentName?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    editData: null,
    type: 'menu',
    lockType: false,
    parentName: '根目录'
  })

  const emit = defineEmits<{
    submit: [data: MenuSubmitData]
    delete: []
    edit: []
    cancel: []
  }>()

  const { width } = useWindowSize()
  const formRef = ref()
  const isEditing = computed(() => props.panelState === 'add' || props.panelState === 'edit')

  const form = reactive<MenuFormData>({
    id: 0,
    parentName: '',
    name: '',
    path: '',
    label: '',
    component: '',
    icon: '',
    isEnable: true,
    sort: 1,
    isMenu: true,
    keepAlive: true,
    isHide: false,
    isHideTab: false,
    link: '',
    isIframe: false,
    showBadge: false,
    showTextBadge: '',
    fixedTab: false,
    activePath: '',
    roles: [],
    isFullPage: false,
    authName: '',
    authLabel: '',
    authIcon: '',
    authSort: 1,
    authList: []
  })

  const rules = reactive<FormRules>({
    name: [
      { required: true, message: '请输入菜单名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    path: [{ required: true, message: '请输入路由地址', trigger: 'blur' }],
    label: [{ required: true, message: '输入权限标识', trigger: 'blur' }],
    authName: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
    authLabel: [{ required: true, message: '请输入权限标识', trigger: 'blur' }]
  })

  const createLabelTooltip = (label: string, tooltip: string) => {
    return () =>
      h('span', { class: 'flex items-center' }, [
        h('span', label),
        h(ElTooltip, { content: tooltip, placement: 'top' }, () =>
          h(ElIcon, { class: 'ml-0.5 cursor-help' }, () => h(QuestionFilled))
        )
      ])
  }

  const isAuthButtonNode = computed(() => Boolean(props.editData?.meta?.isAuthButton))

  const showMenuSections = computed(
    () => !isAuthButtonNode.value && props.type === 'menu'
  )

  const showButtonConfig = computed(() => props.type === 'menu' && !isAuthButtonNode.value)

  const displayStatus = computed(() => {
    if (isEditing.value) return form.isEnable
    return (props.editData?.meta?.isEnable as boolean | undefined) ?? true
  })

  const formatBool = (value?: boolean) => (value ? '是' : '否')

  /** kebab-case 转 PascalCase */
  function kebabToPascalCase(kebab: string): string {
    return kebab
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
  }

  /** 根据 kebab-case 名称获取 Lucide 图标组件 */
  function getIconComp(kebabName: string) {
    const pascalName = kebabToPascalCase(kebabName) as keyof typeof icons
    return icons[pascalName] || null
  }

  const iconDisplayName = (icon: string | null | undefined): string => {
    if (!icon) return '-'
    const normalized = normalizeIcon(icon)
    if (!normalized) return icon
    const parts = normalized.split(':')
    return parts.length > 1 ? parts[1] : parts[0]
  }

  const authButtons = computed<AuthButtonItem[]>(() => {
    if (!props.editData) return []
    if (props.editData.meta?.authList?.length) {
      return props.editData.meta.authList.map((item) => ({
        title: item.title,
        authMark: item.authMark,
        sort: item.sort || 1
      }))
    }
    return (
      props.editData.children
        ?.filter((item) => item.meta?.isAuthButton)
        .map((item, index) => ({
          title: formatMenuTitle(item.meta?.title),
          authMark: item.meta?.authMark || '-',
          sort: (item.meta?.sort as number) || index + 1
        })) || []
    )
  })

  const basicViewItems = computed(() => {
    const row = props.editData
    if (!row) return []

    if (row.meta?.isAuthButton) {
      return [
        { label: '上级菜单', value: props.parentName },
        { label: '权限名称', value: formatMenuTitle(row.meta?.title) },
        { label: '权限标识', value: row.meta?.authMark || '-', code: true },
        { label: '权限排序', value: String((row.meta?.sort as number) || 1) }
      ]
    }

    return [
      { label: '上级菜单', value: props.parentName },
      { label: '菜单名称', value: formatMenuTitle(row.meta?.title) },
      { label: '菜单图标', value: row.meta?.icon || '-', icon: row.meta?.icon || undefined },
      { label: '排序', value: String((row.meta?.sort as number) || 1) }
    ]
  })

  const routeViewItems = computed(() => {
    const row = props.editData
    if (!row) return []

    return [
      { label: '路由地址', value: row.path || '-' },
      { label: '组件路径', value: String(row.component || '-') },
      { label: '外部链接', value: row.meta?.link || '-' }
    ]
  })

  const displayViewItems = computed(() => {
    const row = props.editData
    if (!row) return []

    return [
      {
        label: '是否启用',
        value: formatBool((row.meta?.isEnable as boolean | undefined) ?? true),
        isBool: true,
        boolValue: (row.meta?.isEnable as boolean | undefined) ?? true
      },
      { label: '页面缓存', value: formatBool(row.meta?.keepAlive), isBool: true, boolValue: !!row.meta?.keepAlive },
      { label: '隐藏菜单', value: formatBool(row.meta?.isHide), isBool: true, boolValue: !!row.meta?.isHide },
      { label: '是否内嵌', value: formatBool(row.meta?.isIframe), isBool: true, boolValue: !!row.meta?.isIframe },
      { label: '显示徽章', value: formatBool(row.meta?.showBadge), isBool: true, boolValue: !!row.meta?.showBadge },
      { label: '固定标签', value: formatBool(row.meta?.fixedTab), isBool: true, boolValue: !!row.meta?.fixedTab },
      { label: '标签隐藏', value: formatBool(row.meta?.isHideTab), isBool: true, boolValue: !!row.meta?.isHideTab },
      { label: '全屏页面', value: formatBool(row.meta?.isFullPage), isBool: true, boolValue: !!row.meta?.isFullPage },
      { label: '激活路径', value: row.meta?.activePath || '-' },
      { label: '角色权限', value: row.meta?.roles?.join('、') || '-' },
      { label: '文本徽章', value: row.meta?.showTextBadge || '-' }
    ]
  })

  const displaySwitchItems = computed(() => {
    return displayViewItems.value.filter((item) => item.isBool)
  })

  const displayTextItems = computed(() => {
    return displayViewItems.value.filter((item) => !item.isBool)
  })

  const basicFormItems = computed<FormItem[]>(() => {
    if (props.type === 'button') {
      return [
        {
          label: '上级菜单',
          key: 'parentName',
          type: 'input',
          props: { disabled: true }
        },
        {
          label: '权限名称',
          key: 'authName',
          type: 'input',
          props: { placeholder: '如：新增、编辑、删除' }
        },
        {
          label: '权限标识',
          key: 'authLabel',
          type: 'input',
          props: { placeholder: '如：add、edit、delete' }
        },
        {
          label: '权限排序',
          key: 'authSort',
          type: 'number',
          props: { min: 1, controlsPosition: 'right', style: { width: '100%' } }
        }
      ]
    }

    return [
      {
        label: '上级菜单',
        key: 'parentName',
        type: 'input',
        props: { disabled: true }
      },
      { label: '菜单名称', key: 'name', type: 'input', props: { placeholder: '请输入菜单名称' } },
      { label: '菜单图标', key: 'icon', render: MenuIconPicker },
      {
        label: '排序',
        key: 'sort',
        type: 'number',
        props: { min: 0, controlsPosition: 'right', style: { width: '100%' } }
      },

    ]
  })

  const routeFormItems = computed<FormItem[]>(() => [
    {
      label: createLabelTooltip(
        '路由地址',
        '一级菜单：以 / 开头的绝对路径（如 /dashboard）\n二级及以下：相对路径（如 console、user）'
      ),
      key: 'path',
      type: 'input',
      props: { placeholder: '如: system/menu' }
    },
    {
      label: createLabelTooltip(
        '组件路径',
        '一级父级菜单：填写 /index/index\n具体页面：填写组件路径（如 /system/user）\n目录菜单：留空'
      ),
      key: 'component',
      type: 'input',
      props: { placeholder: '如: system/menu/index' }
    },
    {
      label: '外部链接',
      key: 'link',
      type: 'input',
      span: 24,
      props: { placeholder: '如：https://www.example.com' }
    }
  ])

  const displaySwitchFields = [
    { label: '是否启用', key: 'isEnable' },
    { label: '页面缓存', key: 'keepAlive' },
    { label: '隐藏菜单', key: 'isHide' },
    { label: '是否内嵌', key: 'isIframe' },
    { label: '显示徽章', key: 'showBadge' },
    { label: '固定标签', key: 'fixedTab' },
    { label: '标签隐藏', key: 'isHideTab' },
    { label: '全屏页面', key: 'isFullPage' }
  ] as const satisfies ReadonlyArray<{
    label: string
    key:
      | 'isEnable'
      | 'keepAlive'
      | 'isHide'
      | 'isIframe'
      | 'showBadge'
      | 'fixedTab'
      | 'isHideTab'
      | 'isFullPage'
  }>

  const panelTitle = computed(() => {
    const type = isAuthButtonNode.value || props.type === 'button' ? '按钮' : '菜单'

    if (props.panelState === 'add') {
      return `新增${type}`
    }

    const name = props.editData ? formatMenuTitle(props.editData.meta?.title) : ''
    return isEditing.value ? `编辑${type} — ${name}` : `${type}详情 — ${name}`
  })

  const resetForm = (): void => {
    formRef.value?.reset()
    Object.assign(form, {
      id: 0,
      parentName: props.parentName || '根目录',
      name: '',
      path: '',
      label: '',
      component: '',
      icon: '',
      isEnable: true,
      sort: 1,
      isMenu: true,
      keepAlive: true,
      isHide: false,
      isHideTab: false,
      link: '',
      isIframe: false,
      showBadge: false,
      showTextBadge: '',
      fixedTab: false,
      activePath: '',
      roles: [],
      isFullPage: false,
      authName: '',
      authLabel: '',
      authIcon: '',
      authSort: 1,
      authList: []
    })
  }

  const loadFormData = (): void => {
    if (!props.editData) return

    if (props.type === 'menu' && !props.editData.meta?.isAuthButton) {
      const row = props.editData
      form.id = row.id || 0
      form.name = formatMenuTitle(row.meta?.title || '')
      form.path = row.path || ''
      form.label = String(row.name || '')
      form.component = String(row.component || '')
      form.icon = row.meta?.icon || ''
      form.sort = (row.meta?.sort as number) || 1
      form.isMenu = (row.meta?.isMenu as boolean) ?? true
      form.keepAlive = row.meta?.keepAlive ?? false
      form.isHide = row.meta?.isHide ?? false
      form.isHideTab = row.meta?.isHideTab ?? false
      form.isEnable = (row.meta?.isEnable as boolean | undefined) ?? true
      form.link = row.meta?.link || ''
      form.isIframe = row.meta?.isIframe ?? false
      form.showBadge = row.meta?.showBadge ?? false
      form.showTextBadge = row.meta?.showTextBadge || ''
      form.fixedTab = row.meta?.fixedTab ?? false
      form.activePath = row.meta?.activePath || ''
      form.roles = row.meta?.roles || []
      form.isFullPage = row.meta?.isFullPage ?? false
      form.authList =
        row.meta?.authList?.map((item, index) => ({
          title: item.title,
          authMark: item.authMark,
          sort: index + 1
        })) || []
      return
    }

    const row = props.editData
    form.authName = formatMenuTitle(row.meta?.title || '')
    form.authLabel = row.meta?.authMark || ''
    form.authIcon = (row.meta?.icon as string) || ''
    form.authSort = (row.meta?.sort as number) || 1
  }

  const handleAddAuthButton = (): void => {
    form.authList.push({
      title: '',
      authMark: '',
      sort: form.authList.length + 1
    })
  }

  const handleRemoveAuthButton = (index: number): void => {
    form.authList.splice(index, 1)
  }

  const handleSubmit = async (): Promise<void> => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      emit('submit', { ...form })
    } catch {
      ElMessage.error('表单校验失败，请检查输入')
    }
  }

  const handleCancel = (): void => {
    if (props.panelState === 'edit') {
      loadFormData()
    } else {
      resetForm()
    }
    emit('cancel')
  }

  watch(
    () => [props.panelState, props.editData, props.type] as const,
    () => {
      form.parentName = props.parentName || '根目录'
      nextTick(() => {
        if ((props.panelState === 'edit' || props.panelState === 'view') && props.editData) {
          loadFormData()
        } else if (props.panelState === 'add') {
          resetForm()
        }
      })
    },
    { immediate: true }
  )
</script>

<style lang="scss" src="./menu-detail-panel.scss"></style>
