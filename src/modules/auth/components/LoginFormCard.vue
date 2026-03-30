<script setup lang="ts">
import { ref } from 'vue'

import { Form } from '@primevue/forms'
import type { FormFieldState, FormSubmitEvent } from '@primevue/forms/form'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { isApiError } from '@/shared/api'
import { useAuthStore } from '../store'
import {
  AppButton,
  AppCard,
  AppPasswordField,
  AppTextField,
} from '@/shared/ui'

type LoginFormValues = {
  email: string
  password: string
}

const initialValues: LoginFormValues = {
  email: '',
  password: '',
}

const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()
const isSubmitting = ref(false)
const submitError = ref('')
const serverErrors = ref<Partial<Record<keyof LoginFormValues, string>>>({})

const resolver = ({ values }: { values: Record<string, unknown> }) => {
  const formValues = values as LoginFormValues
  const errors: Record<string, Array<{ message: string }>> = {}

  if (!formValues.email.trim()) {
    errors.email = [{ message: 'Informe seu e-mail.' }]
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
    errors.email = [{ message: 'Digite um e-mail valido.' }]
  }

  if (!formValues.password.trim()) {
    errors.password = [{ message: 'Informe sua senha.' }]
  } else if (formValues.password.trim().length < 8) {
    errors.password = [{ message: 'A senha precisa ter ao menos 8 caracteres.' }]
  }

  return { errors }
}

async function handleSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  const { valid, states } = event

  if (!valid) {
    return
  }

  const formStates = states as Record<keyof LoginFormValues, FormFieldState | undefined>
  const formValues: LoginFormValues = {
    email: String(formStates.email?.value ?? ''),
    password: String(formStates.password?.value ?? ''),
  }

  isSubmitting.value = true
  submitError.value = ''
  serverErrors.value = {}

  try {
    await authStore.login(formValues)

    toast.add({
      severity: 'success',
      summary: 'Login realizado com sucesso.',
      life: 3000,
    })

    await router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/')
  } catch (error) {
    if (isApiError(error)) {
      serverErrors.value = error.validationErrors as Partial<Record<keyof LoginFormValues, string>>
      submitError.value = error.status === 401 ? 'E-mail ou senha invalidos.' : error.message
      return
    }

    submitError.value = 'Nao foi possivel entrar agora.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppCard class="login-card">
    <template #content>
      <Form
        v-slot="$form"
        :initial-values="initialValues"
        :resolver="resolver"
        :validate-on-value-update="false"
        :validate-on-blur="true"
        class="login-form"
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
            autocomplete="current-password"
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
        </div>

        <RouterLink class="forgot-link" to="/forgot-password">Esqueceu a senha?</RouterLink>

        <AppButton
          :loading="isSubmitting"
          :disabled="!$form.email?.value || !$form.password?.value"
          fluid
          label="Entrar"
          severity="primary"
          type="submit"
        />

        <p class="signup-hint">
          Não tem uma conta?
          <RouterLink class="text-link" to="/register">Criar conta</RouterLink>
        </p>
      </Form>
    </template>
  </AppCard>
</template>

<style scoped>
.login-card {
  width: min(100%, 24rem);
}

.login-form {
  display: grid;
  gap: 1rem;
}

.fields {
  display: grid;
  gap: 0.75rem;
}

.forgot-link {
  justify-self: end;
  margin-top: -0.15rem;
  color: var(--p-primary-color);
  font-size: 0.88rem;
  text-decoration: none;
  font-weight: 500;
}

.signup-hint {
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
