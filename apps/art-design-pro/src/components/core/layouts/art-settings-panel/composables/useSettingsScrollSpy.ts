import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export function useSettingsScrollSpy(scrollEl: Ref<HTMLElement | null>) {
  const activeSection = ref<string>('theme')

  let observer: IntersectionObserver | null = null

  const scrollToSection = (id: string) => {
    const el = scrollEl.value?.querySelector<HTMLElement>(`[data-section="${id}"]`)
    if (!el || !scrollEl.value) return
    scrollEl.value.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' })
  }

  onMounted(() => {
    const root = scrollEl.value
    if (!root) return

    observer = new IntersectionObserver(
      (entries) => {
        // 取所有当前可见的 section，选 offsetTop 最小的（最靠上）
        const visible = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement)

        if (visible.length > 0) {
          visible.sort((a, b) => a.offsetTop - b.offsetTop)
          const id = visible[0].dataset.section
          if (id) activeSection.value = id
        }
      },
      {
        root,
        rootMargin: '-60px 0px -50% 0px',
        threshold: 0
      }
    )

    root.querySelectorAll<HTMLElement>('[data-section]').forEach((el) => {
      observer!.observe(el)
    })
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return { activeSection, scrollToSection }
}
