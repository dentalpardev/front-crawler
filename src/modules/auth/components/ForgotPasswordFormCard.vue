<script setup lang="ts">
import { Form } from '@primevue/forms'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { RouterLink } from 'vue-router'

import { AppButton, AppCard, AppTextField } from '@/shared/ui'

type ForgotPasswordFormValues = {
  email: string
}

const initialValues: ForgotPasswordFormValues = {
  email: '',
}

const toast = useToast()

const resolver = ({ values }: { values: Record<string, unknown> }) => {
  const formValues = values as ForgotPasswordFormValues
  const errors: Record<string, Array<{ message: string }>> = {}

  if (!formValues.email.trim()) {
    errors.email = [{ message: 'Informe seu e-mail.' }]
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
    errors.email = [{ message: 'Digite um e-mail valido.' }]
  }

  return { errors }
}

function handleSubmit({ valid }: { valid: boolean }) {
  if (!valid) {
    return
  }

  toast.add({
    severity: 'warn',
    summary: 'Recuperacao de senha ainda nao disponivel no backend.',
    life: 3500,
  })
}
</script>

<template>
  <AppCard class="forgot-password-card">
    <template #content>
      <Form
        v-slot="$form"
        :initial-values="initialValues"
        :resolver="resolver"
        :validate-on-value-update="false"
        :validate-on-blur="true"
        class="forgot-password-form"
        @submit="handleSubmit"
      >
        <div class="fields">
          <AppTextField
            label="E-mail"
            icon="pi pi-envelope"
            name="email"
            placeholder="seu@email.com"
            autocomplete="email"
            type="email"
            :invalid="Boolean($form.email?.invalid)"
          />
          <Message
            v-if="$form.email?.invalid"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.email.error?.message }}
          </Message>
        </div>

        <AppButton
          :disabled="!$form.email?.value"
          fluid
          label="Enviar link de recuperação"
          severity="primary"
          type="submit"
        />

        <RouterLink class="back-link" to="/login">
          <i class="pi pi-arrow-left" aria-hidden="true" />
          <span>Voltar para o login</span>
        </RouterLink>
      </Form>
    </template>
  </AppCard>
</template>

<style scoped>
.forgot-password-card {
  width: min(100%, 24rem);
}

.forgot-password-form {
  display: grid;
  gap: 1rem;
}

.fields {
  display: grid;
  gap: 0.75rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.1rem;
  color: var(--p-text-muted-color);
  text-decoration: none;
  font-size: 0.92rem;
}
</style>
