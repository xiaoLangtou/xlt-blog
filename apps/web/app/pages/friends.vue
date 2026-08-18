<script setup lang="ts">
import type { FriendLinkDto } from '@xlt-blog/shared'

const { data: links, pending } = useApi<FriendLinkDto[]>('/links')

useSeoMeta({
  title: '友链',
  description: '互相往来的朋友们'
})

function initial(name: string) {
  return name.trim().charAt(0) || '友'
}
</script>

<template>
  <UContainer class="max-w-6xl py-12">
    <header class="mb-10 border-b border-default/60 pb-6">
      <p class="font-mono text-xs tracking-[0.25em] text-dimmed uppercase mb-3">Friends</p>
      <h1 class="font-display text-3xl text-highlighted tracking-wide">
        友情链接
      </h1>
      <p class="text-sm text-muted mt-2">
        海内存知己，天涯若比邻
      </p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-12">
      <div>
        <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <USkeleton v-for="i in 4" :key="i" class="h-24 w-full" />
        </div>

        <div v-else-if="links?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <a
            v-for="link in links"
            :key="link.id"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="book-frame group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-elevated/40"
          >
            <img
              v-if="link.logo"
              :src="link.logo"
              :alt="link.name"
              class="size-11 rounded-full border border-default/60 object-cover shrink-0"
              loading="lazy"
            >
            <span
              v-else
              class="size-11 rounded-full border border-default/60 bg-elevated/60 flex items-center justify-center font-display text-lg text-muted shrink-0"
              aria-hidden="true"
            >
              {{ initial(link.name) }}
            </span>

            <span class="min-w-0">
              <span class="block font-display text-base text-highlighted tracking-wide group-hover:text-primary transition-colors truncate">
                {{ link.name }}
              </span>
              <span class="block text-xs text-muted mt-1 leading-relaxed line-clamp-2">
                {{ link.description || link.url }}
              </span>
            </span>
          </a>
        </div>

        <div v-else class="text-center py-20">
          <p class="font-display text-lg text-muted tracking-widest">门庭尚静，虚位以待</p>
          <p class="text-xs text-dimmed mt-2 font-mono">NO FRIENDS LINKED YET</p>
        </div>
      </div>

      <div class="hidden lg:block">
        <div class="sticky top-24">
          <BlogSidebar />
        </div>
      </div>
    </div>
  </UContainer>
</template>
