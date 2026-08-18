<script setup lang="ts">
import type { CommentDto } from '@xlt-blog/shared'

const props = defineProps<{
  slug: string
}>()

const toast = useToast()

const { data: comments, refresh } = useApi<CommentDto[]>(`/articles/${props.slug}/comments`)

const form = reactive({
  nickname: '',
  email: '',
  content: ''
})

const submitting = ref(false)

async function submit() {
  if (!form.nickname.trim() || !form.content.trim()) {
    toast.add({ title: '请填写昵称与评论内容', color: 'warning' })
    return
  }
  submitting.value = true
  try {
    await apiFetch(`/articles/${props.slug}/comments`, {
      method: 'POST',
      body: {
        nickname: form.nickname.trim(),
        email: form.email.trim() || undefined,
        content: form.content.trim()
      }
    })
    toast.add({ title: '评论已提交，等待博主审核后展示', color: 'success' })
    form.content = ''
    refresh()
  }
  catch (error: any) {
    toast.add({ title: '提交失败', description: error?.data?.message, color: 'error' })
  }
  finally {
    submitting.value = false
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}
</script>

<template>
  <section>
    <h2 class="font-display text-xl text-highlighted tracking-wide mb-6">
      评论
      <span v-if="comments?.length" class="font-mono text-xs font-normal text-dimmed ml-2">{{ comments.length }} 条</span>
    </h2>

    <div class="border border-default/60 rounded-xs p-4 mb-10 space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UInput v-model="form.nickname" placeholder="昵称（必填）" icon="i-lucide-user" />
        <UInput v-model="form.email" type="email" placeholder="邮箱（选填，不公开）" icon="i-lucide-mail" />
      </div>
      <UTextarea
        v-model="form.content"
        :rows="3"
        autoresize
        placeholder="友好交流，评论审核后展示..."
        class="w-full"
      />
      <div class="flex justify-end">
        <UButton label="提交评论" :loading="submitting" @click="submit" />
      </div>
    </div>

    <div v-if="comments?.length" class="space-y-6">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="flex gap-3"
      >
        <UAvatar :alt="comment.nickname" size="md" />
        <div class="min-w-0 flex-1">
          <div class="flex items-baseline gap-2">
            <span class="font-medium text-highlighted text-sm">{{ comment.nickname }}</span>
            <span class="font-mono text-[11px] text-dimmed">{{ formatDate(comment.createdAt) }}</span>
          </div>
          <p class="text-sm mt-1 leading-relaxed whitespace-pre-wrap">{{ comment.content }}</p>
        </div>
      </div>
    </div>

    <p v-else class="text-center text-sm text-dimmed py-8 tracking-widest">
      还没有评论，来抢沙发～
    </p>
  </section>
</template>
