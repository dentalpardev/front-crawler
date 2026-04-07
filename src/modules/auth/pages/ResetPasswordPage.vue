<script setup lang="ts">
import { AppBrandLogo } from '@/shared/ui'

import AuthPageLayout from '../components/AuthPageLayout.vue'
import ResetPasswordFormCard from '../components/ResetPasswordFormCard.vue'
</script>

<template>
  <AuthPageLayout>
    <section class="reset-password-shell">
      <div class="reset-password-brand">
        <AppBrandLogo size="xl" />
        <div class="reset-password-brand-copy">
          <h1>Redefinir Senha</h1>
          <p>Escolha uma nova senha para concluir o acesso a sua conta.</p>
        </div>
      </div>

      <ResetPasswordFormCard />
    </section>
  </AuthPageLayout>
</template>

<style scoped>
.reset-password-shell {
  display: grid;
  justify-items: center;
  gap: 1.5rem;
  width: 100%;
}

.reset-password-brand {
  display: grid;
  justify-items: center;
  gap: 1rem;
}

.reset-password-brand-copy {
  text-align: center;
}

.reset-password-brand-copy h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
}

.reset-password-brand-copy p {
  margin: 0.35rem 0 0;
  color: var(--p-text-muted-color);
  font-size: 0.95rem;
}
</style>
