<script setup lang="ts">
import { ref } from 'vue'

import { Form } from '@primevue/forms'
import type { FormFieldState, FormSubmitEvent } from '@primevue/forms/form'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { RouterLink, useRouter } from 'vue-router'

import { isApiError } from '@/shared/api'
import { useAuthStore } from '../store'
import { AppButton, AppCard, AppPasswordField, AppTextField } from '@/shared/ui'

type RegisterFormValues = {
  email: string
  password: string
  confirmPassword: string
}

const initialValues: RegisterFormValues = {
  email: '',
  password: '',
  confirmPassword: '',
}

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const isSubmitting = ref(false)
const submitError = ref('')
const serverErrors = ref<Partial<Record<keyof RegisterFormValues, string>>>({})

function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  )
}

const resolver = ({ values }: { values: Record<string, unknown> }) => {
  const formValues = values as RegisterFormValues
  const errors: Record<string, Array<{ message: string }>> = {}

  if (!formValues.email.trim()) {
    errors.email = [{ message: 'Informe seu e-mail.' }]
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
    errors.email = [{ message: 'Digite um e-mail valido.' }]
  }

  if (!formValues.password.trim()) {
    errors.password = [{ message: 'Informe sua senha.' }]
  } else if (!isStrongPassword(formValues.password.trim())) {
    errors.password = [{ message: 'A senha precisa seguir os requisitos abaixo.' }]
  }

  if (!formValues.confirmPassword.trim()) {
    errors.confirmPassword = [{ message: 'Confirme sua senha.' }]
  } else if (formValues.confirmPassword !== formValues.password) {
    errors.confirmPassword = [{ message: 'As senhas precisam ser iguais.' }]
  }

  return { errors }
}

async function handleSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  const { valid, states } = event

  if (!valid) {
    return
  }

  const formStates = states as Record<keyof RegisterFormValues, FormFieldState | undefined>
  const formValues: RegisterFormValues = {
    email: String(formStates.email?.value ?? ''),
    password: String(formStates.password?.value ?? ''),
    confirmPassword: String(formStates.confirmPassword?.value ?? ''),
  }

  isSubmitting.value = true
  submitError.value = ''
  serverErrors.value = {}

  try {
    await authStore.register({
      email: formValues.email.trim(),
      password: formValues.password.trim(),
    })

    toast.add({
      severity: 'success',
      summary: 'Conta criada com sucesso. Faça login para continuar.',
      life: 3500,
    })

    await router.push('/login')
  } catch (error) {
    if (isApiError(error)) {
      serverErrors.value = error.validationErrors as Partial<Record<keyof RegisterFormValues, string>>
      submitError.value = error.message
      return
    }

    submitError.value = 'Nao foi possivel criar sua conta agora.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppCard class="register-card">
    <template #content>
      <Form
        v-slot="$form"
        :initial-values="initialValues"
        :resolver="resolver"
        :validate-on-value-update="false"
        :validate-on-blur="true"
        class="register-form"
        @submit="handleSubmit"
      >
        <Message v-if="submitError" severity="error" variant="simple">
          {{ submitError }}
        </Message>

        <div class="fields">
          <AppTextField
            label="E-mail"
            icon="pi pi-envelope"
            name="email"
            placeholder="seu@email.com"
            autocomplete="email"
            type="email"
            :invalid="Boolean($form.email?.invalid || serverErrors.email)"
          />
          <Message
            v-if="$form.email?.invalid || serverErrors.email"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.email?.error?.message ?? serverErrors.email }}
          </Message>

          <AppPasswordField
            label="Senha"
            icon="pi pi-lock"
            name="password"
            placeholder="Digite sua senha"
            autocomplete="new-password"
            :invalid="Boolean($form.password?.invalid || serverErrors.password)"
          />
          <Message
            v-if="$form.password?.invalid || serverErrors.password"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.password?.error?.message ?? serverErrors.password }}
          </Message>

          <AppPasswordField
            label="Confirmar senha"
            icon="pi pi-lock"
            name="confirmPassword"
            placeholder="Repita sua senha"
            autocomplete="new-password"
            :invalid="Boolean($form.confirmPassword?.invalid)"
          />
          <Message
            v-if="$form.confirmPassword?.invalid"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.confirmPassword.error?.message }}
          </Message>
        </div>

        <AppButton
          :loading="isSubmitting"
          :disabled="
            !$form.email?.value ||
            !$form.password?.value ||
            !$form.confirmPassword?.value
          "
          fluid
          label="Criar conta"
          severity="primary"
          type="submit"
        />

        <p class="signin-hint">
          Já tem uma conta?
          <RouterLink class="text-link" to="/login">Entrar</RouterLink>
        </p>
      </Form>
    </template>
  </AppCard>
</template>

<style scoped>
.register-card {
  width: min(100%, 24rem);
}

.register-form {
  display: grid;
  gap: 1rem;
}

.fields {
  display: grid;
  gap: 0.75rem;
}

.signin-hint {
  margin: 0.2rem 0 0;
  text-align: center;
  font-size: 0.88rem;
}

.text-link {
  color: var(--p-primary-color);
  text-decoration: none;
  font-weight: 600;
}
</style>
