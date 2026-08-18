<!-- 登录页面 -->
<template>
  <div class="flex w-full h-screen overflow-hidden">
    <!-- 左侧视觉区域 -->
    <LoginLeftView />

    <!-- 右侧表单区域 -->
    <div class="relative flex-1 flex items-center justify-center p-6 lg:p-12">
      <AuthTopBar />

      <!-- 移动端顶部渐变色条 -->
      <div
        class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--el-color-primary)] to-[var(--el-color-primary-light-3)] lg:hidden"
      />

      <div class="auth-right-wrap">
        <div class="form">
          <!-- Logo + 标题区 -->
          <div class="text-center mb-8">
            <div
              class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--el-color-primary-light-9)] mb-5"
            >
              <ArtLogo size="36" />
            </div>
            <h3 class="title">{{ $t('login.title') }}</h3>
            <p class="sub-title">{{ $t('login.subTitle') }}</p>
          </div>

          <ElForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            :key="formKey"
            class="form-fields"
            @keyup.enter="handleSubmit"
          >
            <!-- 账号 -->
            <ElFormItem prop="username">
              <ElInput
                class="custom-height"
                :placeholder="$t('login.placeholder.username')"
                v-model.trim="formData.username"
                autocomplete="username"
              >
                <template #prefix>
                  <ArtSvgIcon icon="ri:user-line" class="text-base text-g-500" />
                </template>
              </ElInput>
            </ElFormItem>

            <!-- 密码 -->
            <ElFormItem prop="password">
              <ElInput
                class="custom-height"
                :placeholder="$t('login.placeholder.password')"
                v-model.trim="formData.password"
                type="password"
                autocomplete="current-password"
                show-password
              >
                <template #prefix>
                  <ArtSvgIcon icon="ri:lock-line" class="text-base text-g-500" />
                </template>
              </ElInput>
            </ElFormItem>

            <!-- 登录按钮 -->
            <div class="mt-6">
              <ElButton
                class="w-full custom-height login-btn"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
                v-ripple
              >
                {{ $t('login.btnText') }}
              </ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'
  import { useUserStore } from '@/store/modules/user'
  import { useI18n } from 'vue-i18n'
  import { HttpError } from '@/utils/http/error'
  import { fetchLogin } from '@/api/auth'
  import { ElNotification, type FormInstance, type FormRules } from 'element-plus'

  defineOptions({ name: 'Login' })

  const { t, locale } = useI18n()
  const formKey = ref(0)

  // 监听语言切换，重置表单
  watch(locale, () => {
    formKey.value++
  })

  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()

  const systemName = AppConfig.systemInfo.name
  const formRef = ref<FormInstance>()

  const formData = reactive({
    username: '',
    password: '',
    rememberPassword: true
  })

  const rules = computed<FormRules>(() => ({
    username: [{ required: true, message: t('login.placeholder.username'), trigger: 'blur' }],
    password: [{ required: true, message: t('login.placeholder.password'), trigger: 'blur' }]
  }))

  const loading = ref(false)

  // 登录
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      const valid = await formRef.value.validate()
      if (!valid) return

      loading.value = true

      const { username, password } = formData
      const { accessToken, userInfo } = await fetchLogin({
        username,
        password
      })

      if (!accessToken) {
        throw new Error('Login failed - no token received')
      }

      userStore.setToken(accessToken)
      userStore.setUserInfo(userInfo)
      userStore.setLoginStatus(true)
      showLoginSuccessNotice()

      const redirect = route.query.redirect as string
      router.push(redirect || '/blog/articles')
    } catch (error) {
      if (!(error instanceof HttpError)) {
        console.error('[Login] Unexpected error:', error)
      }
    } finally {
      loading.value = false
    }
  }

  // 登录成功提示
  const showLoginSuccessNotice = () => {
    setTimeout(() => {
      ElNotification({
        title: t('login.success.title'),
        type: 'success',
        duration: 2500,
        zIndex: 10000,
        message: `${t('login.success.message')}, ${systemName}!`
      })
    }, 1000)
  }
</script>

<style scoped>
  @import './style.css';
</style>
