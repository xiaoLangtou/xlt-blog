export function useBlogArticleStats(content: () => string) {
  const words = computed(() => {
    const value = content()
      .replace(/```[\s\S]*?```/g, '')
      .trim()
    const cjk = (value.match(/[㐀-鿿]/g) ?? []).length
    const western =
      value.replace(/[㐀-鿿]/g, ' ').match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g)?.length ?? 0
    return cjk + western
  })

  const readMinutes = computed(() => Math.max(1, Math.ceil(words.value / 300)))
  return { words, readMinutes }
}
