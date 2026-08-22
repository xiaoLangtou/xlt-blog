<!-- 404页面 -->
<template>
  <ArtException
    :data="{
      title: '404',
      desc: $t('exceptionPage.404'),
      btnText: $t('exceptionPage.gohome'),
      loginBtnText: $t('exceptionPage.goLogin'),
      imgUrl
    }"
  />
</template>

<script setup lang="ts">
  import imgUrl from '@imgs/svg/404.svg'
  defineOptions({ name: 'Exception404' })
</script>
