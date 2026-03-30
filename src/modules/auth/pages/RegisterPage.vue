<script setup lang="ts">
import { AppBrandLogo } from '@/shared/ui'

import AuthPageLayout from '../components/AuthPageLayout.vue'
import RegisterFormCard from '../components/RegisterFormCard.vue'
</script>

<template>
  <AuthPageLayout>
    <section class="register-shell">
      <div class="register-brand">
        <AppBrandLogo size="xl" />
        <div class="register-brand-copy">
          <h1>Criar Conta</h1>
          <p>Preencha seus dados para começar</p>
        </div>
      </div>

      <RegisterFormCard />
    </section>
  </AuthPageLayout>
</template>

<style scoped>
.register-shell {
  display: grid;
  justify-items: center;
  gap: 1.5rem;
  width: 100%;
}

.register-brand {
  display: grid;
  justify-items: center;
  gap: 1rem;
}

.register-brand-copy {
  text-align: center;
}

.register-brand-copy h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
}

.register-brand-copy p {
  margin: 0.35rem 0 0;
  color: var(--p-text-muted-color);
  font-size: 0.95rem;
}
</style>
