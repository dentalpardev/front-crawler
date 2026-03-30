<script setup lang="ts">
import AuthPageLayout from '../components/AuthPageLayout.vue'
import LoginFormCard from '../components/LoginFormCard.vue'
import { AppBrandLogo } from '@/shared/ui'
</script>

<template>
  <AuthPageLayout>
    <section class="login-shell">
      <div class="login-brand">
        <AppBrandLogo size="xl" />
        <div class="login-brand-copy">
          <h1>Dentalpar Busca Odontológica</h1>
          <p>Entre na sua conta</p>
        </div>
      </div>

      <LoginFormCard />
    </section>
  </AuthPageLayout>
</template>

<style scoped>
.login-shell {
  display: grid;
  justify-items: center;
  gap: 1.5rem;
  width: 100%;
}

.login-brand {
  display: grid;
  justify-items: center;
  gap: 1rem;
}

.login-brand-copy {
  text-align: center;
}

.login-brand-copy h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
}

.login-brand-copy p {
  margin: 0.35rem 0 0;
  color: var(--p-text-muted-color);
  font-size: 0.95rem;
}
</style>
