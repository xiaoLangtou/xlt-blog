<!-- 角色管理空状态组件 -->
<template>
  <div class="role-empty-state">
    <div class="role-empty-card">
      <img
        src="@/assets/images/common/show-role.svg"
        alt="请选择一个角色来查看相关权限和功能"
        class="role-empty-img"
      />
      <h2 class="role-empty-heading">请选择角色</h2>
      <p class="role-empty-desc">您需要选择一个角色来查看相关权限和功能</p>
    </div>

    <div class="role-empty-info">
      <div class="role-empty-info-header">
        <ArtSvgIcon icon="ri:information-line" :size="18" class="role-empty-info-icon" />
        <span>角色说明</span>
      </div>
      <p class="role-empty-info-text">
        角色用于标识团队中不同的职责和权限，如财务、人事或项目管理。选择角色后可以查看和使用相应的功能模块。
      </p>
      <a href="/help/roles" class="role-empty-info-link">了解更多角色相关信息</a>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'RoleEmptyState' })
</script>

<style lang="scss" scoped>
.role-empty-state {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: 24px;
  max-width: 768px;
  margin: 0 auto;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.role-empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px;
  background: var(--art-gray-100);
  border-radius: 12px;
  width: 100%;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}

:global(.dark) .role-empty-card {
  background: var(--art-gray-800);
}

.role-empty-img {
  width: 176px;
  height: auto;
  margin-bottom: 32px;
}

.role-empty-heading {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--art-gray-800);
  margin-bottom: 12px;
}

:global(.dark) .role-empty-heading {
  color: var(--art-gray-100);
}

.role-empty-desc {
  margin: 0;
  font-size: 16px;
  color: var(--art-gray-600);
  max-width: 448px;
  margin-bottom: 0;
}

:global(.dark) .role-empty-desc {
  color: var(--art-gray-300);
}

.role-empty-info {
  margin-top: 40px;
  padding: 16px;
  background: var(--art-gray-100);
  border-left: 4px solid var(--art-gray-400);
  border-radius: 4px;
  width: 100%;
}

:global(.dark) .role-empty-info {
  background: var(--art-gray-200);
  border-left-color: var(--art-gray-500);
}

.role-empty-info-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  color: var(--art-gray-700);
  font-weight: 600;
}

.role-empty-info-icon {
  margin-right: 8px;
}

.role-empty-info-text {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--art-gray-700);
}

:global(.dark) .role-empty-info-text {
  color: var(--art-gray-300);
}

.role-empty-info-link {
  font-size: 14px;
  font-weight: 500;
  color: var(--art-gray-600);
  text-decoration: none;

  &:hover {
    color: var(--art-gray-700);
    text-decoration: underline;
  }
}

@media (max-width: 960px) {
  .role-empty-state {
    min-height: 50vh;
    padding: 20px;
  }

  .role-empty-card {
    padding: 24px 16px;
  }

  .role-empty-img {
    width: 144px;
    margin-bottom: 24px;
  }

  .role-empty-heading {
    font-size: 20px;
  }

  .role-empty-desc {
    font-size: 14px;
  }
}
</style>
