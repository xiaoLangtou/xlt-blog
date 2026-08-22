<!-- 403页面 -->
<template>
  <ArtException
    :data="{
      title: '403',
      desc: $t('exceptionPage.403'),
      btnText: $t('exceptionPage.gohome'),
      loginBtnText: $t('exceptionPage.goLogin'),
      imgUrl
    }"
  />
</template>

<script setup lang="ts">
  import imgUrl from '@imgs/svg/403.svg'
  defineOptions({ name: 'Exception403' })
</script>
