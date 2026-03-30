<script setup lang="ts">
import { AppBrandLogo } from '@/shared/ui'

import AuthPageLayout from '../components/AuthPageLayout.vue'
import ForgotPasswordFormCard from '../components/ForgotPasswordFormCard.vue'
</script>

<template>
  <AuthPageLayout>
    <section class="forgot-password-shell">
      <div class="forgot-password-brand">
        <AppBrandLogo size="xl" />
        <div class="forgot-password-brand-copy">
          <h1>Recuperar Senha</h1>
          <p>Informe seu e-mail para redefinir a senha</p>
        </div>
      </div>

      <ForgotPasswordFormCard />
    </section>
  </AuthPageLayout>
</template>

<style scoped>
.forgot-password-shell {
  display: grid;
  justify-items: center;
  gap: 1.5rem;
  width: 100%;
}

.forgot-password-brand {
  display: grid;
  justify-items: center;
  gap: 1rem;
}

.forgot-password-brand-copy {
  text-align: center;
}

.forgot-password-brand-copy h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
}

.forgot-password-brand-copy p {
  margin: 0.35rem 0 0;
  color: var(--p-text-muted-color);
  font-size: 0.95rem;
}
</style>
