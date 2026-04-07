<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { Form } from '@primevue/forms'
import type { FormFieldState, FormSubmitEvent } from '@primevue/forms/form'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { isApiError } from '@/shared/api'
import { AppButton, AppCard, AppPasswordField } from '@/shared/ui'
import { resetPassword } from '../api'

type ResetPasswordFormValues = {
  password: string
  confirmPassword: string
}

const initialValues: ResetPasswordFormValues = {
  password: '',
  confirmPassword: '',
}

const router = useRouter()
const route = useRoute()
const toast = useToast()
const isSubmitting = ref(false)
const submitError = ref('')
const invalidToken = ref(false)

onMounted(async () => {
  if (!token.value) {
    await router.replace('/forgot-password')
  }
})

const token = computed(() =>
  typeof route.query.token === 'string' ? route.query.token.trim() : '',
)

function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  )
}

const resolver = ({ values }: { values: Record<string, unknown> }) => {
  const formValues = values as ResetPasswordFormValues
  const errors: Record<string, Array<{ message: string }>> = {}

  if (!token.value) {
    errors.password = [{ message: 'Token de redefinicao ausente ou invalido.' }]
  }

  if (!formValues.password.trim()) {
    errors.password = [{ message: 'Informe sua nova senha.' }]
  } else if (!isStrongPassword(formValues.password.trim())) {
    errors.password = [{ message: 'A senha precisa seguir os requisitos abaixo.' }]
  }

  if (!formValues.confirmPassword.trim()) {
    errors.confirmPassword = [{ message: 'Confirme sua nova senha.' }]
  } else if (formValues.confirmPassword !== formValues.password) {
    errors.confirmPassword = [{ message: 'As senhas precisam ser iguais.' }]
  }

  return { errors }
}

async function handleSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  const { valid, states } = event

  if (!valid || !token.value) {
    return
  }

  const formStates = states as Record<keyof ResetPasswordFormValues, FormFieldState | undefined>
  const password = String(formStates.password?.value ?? '').trim()

  isSubmitting.value = true
  submitError.value = ''
  invalidToken.value = false

  try {
    const response = await resetPassword({
      token: token.value,
      password,
    })

    toast.add({
      severity: 'success',
      summary: response.message,
      life: 3500,
    })

    await router.push('/login')
  } catch (error) {
    if (isApiError(error)) {
      if (
        error.status === 422 &&
        /token/i.test(error.message) &&
        /(invalid|expired|invalido|expirado)/i.test(error.message)
      ) {
        invalidToken.value = true
        submitError.value = 'Esse link de redefinicao e invalido ou expirou.'
        return
      }

      submitError.value = error.message
      return
    }

    submitError.value = 'Nao foi possivel redefinir sua senha agora.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppCard class="reset-password-card">
    <template #content>
      <Form
        v-slot="$form"
        :initial-values="initialValues"
        :resolver="resolver"
        :validate-on-value-update="false"
        :validate-on-blur="true"
        class="reset-password-form"
        @submit="handleSubmit"
      >
        <Message v-if="invalidToken" severity="error" variant="outlined">
          Esse link de redefinicao nao e mais valido. Solicite um novo e-mail para continuar.
        </Message>

        <Message v-else severity="secondary" variant="simple">
          Digite sua nova senha para concluir a redefinicao.
        </Message>

        <Message v-if="submitError" severity="error" variant="simple">
          {{ submitError }}
        </Message>

        <div class="fields">
          <AppPasswordField
            label="Nova senha"
            icon="pi pi-lock"
            name="password"
            placeholder="Digite sua nova senha"
            autocomplete="new-password"
            :disabled="!token"
            :invalid="Boolean($form.password?.invalid)"
            hint="Use ao menos 8 caracteres, com letra maiuscula, minuscula e numero."
          />
          <Message
            v-if="$form.password?.invalid"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.password.error?.message }}
          </Message>

          <AppPasswordField
            label="Confirmar nova senha"
            icon="pi pi-lock"
            name="confirmPassword"
            placeholder="Repita sua nova senha"
            autocomplete="new-password"
            :disabled="!token"
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
          :disabled="!token || invalidToken || !$form.password?.value || !$form.confirmPassword?.value"
          :loading="isSubmitting"
          fluid
          label="Redefinir senha"
          severity="primary"
          type="submit"
        />

        <RouterLink
          v-if="invalidToken"
          class="back-link"
          to="/forgot-password"
        >
          <i class="pi pi-refresh" aria-hidden="true" />
          <span>Solicitar novo link</span>
        </RouterLink>

        <RouterLink
          v-else
          class="back-link"
          to="/login"
        >
          <i class="pi pi-arrow-left" aria-hidden="true" />
          <span>Voltar para o login</span>
        </RouterLink>
      </Form>
    </template>
  </AppCard>
</template>

<style scoped>
.reset-password-card {
  width: min(100%, 26rem);
}

.reset-password-form {
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
