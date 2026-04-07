<script setup lang="ts">
import { computed, ref } from 'vue'

import { Form } from '@primevue/forms'
import type { FormFieldState, FormSubmitEvent } from '@primevue/forms/form'
import Message from 'primevue/message'
import { RouterLink } from 'vue-router'

import { isApiError } from '@/shared/api'
import { AppButton, AppCard, AppTextField } from '@/shared/ui'
import { forgotPassword, type ForgotPasswordResponse } from '../api'

type ForgotPasswordFormValues = {
  email: string
}

const initialValues: ForgotPasswordFormValues = {
  email: '',
}

const formKey = ref(0)
const isSubmitting = ref(false)
const submitError = ref('')
const emailApiError = ref('')
const submittedEmail = ref('')
const responseData = ref<ForgotPasswordResponse | null>(null)

const hasLocalDebugData = computed(
  () => responseData.value?.debug?.previewFile || responseData.value?.debug?.mailSent !== undefined,
)

const expiresHint = computed(() => {
  const expiresInSeconds = responseData.value?.expiresInSeconds

  if (!expiresInSeconds) {
    return ''
  }

  if (expiresInSeconds % 3600 === 0) {
    const hours = expiresInSeconds / 3600
    return hours === 1 ? 'O link expira em cerca de 1 hora.' : `O link expira em cerca de ${hours} horas.`
  }

  if (expiresInSeconds % 60 === 0) {
    const minutes = expiresInSeconds / 60
    return minutes === 1
      ? 'O link expira em cerca de 1 minuto.'
      : `O link expira em cerca de ${minutes} minutos.`
  }

  return `O link expira em cerca de ${expiresInSeconds} segundos.`
})

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

async function handleSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  const { valid, states } = event

  if (!valid) {
    return
  }

  const formStates = states as Record<keyof ForgotPasswordFormValues, FormFieldState | undefined>
  const email = String(formStates.email?.value ?? '').trim()

  if (!email) {
    submitError.value = 'Informe seu e-mail.'
    return
  }

  isSubmitting.value = true
  submitError.value = ''
  emailApiError.value = ''

  try {
    responseData.value = await forgotPassword({ email })
    submittedEmail.value = email
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 422 && error.validationErrors.email) {
        emailApiError.value = error.validationErrors.email
        return
      }

      if (error.status === 503) {
        submitError.value =
          'O envio do link esta temporariamente indisponivel. Tente novamente em alguns minutos.'
        return
      }

      submitError.value = error.message
      return
    }

    submitError.value = 'Nao foi possivel solicitar a recuperacao agora.'
  } finally {
    isSubmitting.value = false
  }
}

function resetFlow() {
  submittedEmail.value = ''
  responseData.value = null
  submitError.value = ''
  emailApiError.value = ''
  formKey.value += 1
}
</script>

<template>
  <AppCard class="forgot-password-card">
    <template #content>
      <div v-if="submittedEmail && responseData" class="forgot-password-form">
        <Message severity="success" variant="outlined">
          Solicitação enviada com sucesso.
        </Message>

        <Message severity="secondary" variant="simple">
          Se existir uma conta vinculada a <strong>{{ submittedEmail }}</strong>, voce recebera um
          link para redefinir sua senha em instantes.
        </Message>

        <Message v-if="expiresHint" severity="contrast" variant="simple">
          {{ expiresHint }}
        </Message>

        <Message
          v-if="!responseData.debug?.mailSent && hasLocalDebugData"
          severity="warn"
          variant="outlined"
        >
          Ambiente local: se o e-mail nao aparecer na caixa de entrada, valide o link pelo Mailpit
          ou pelo preview salvo em <code>{{ responseData?.debug?.previewFile }}</code>.
        </Message>

        <Message
          v-else-if="responseData.debug?.mailSent"
          severity="secondary"
          variant="simple"
        >
          Confira sua caixa de entrada para continuar a redefinicao.
        </Message>

        <AppButton
          fluid
          label="Usar outro e-mail"
          severity="secondary"
          type="button"
          variant="outlined"
          @click="resetFlow"
        />

        <RouterLink class="back-link" to="/login">
          <i class="pi pi-arrow-left" aria-hidden="true" />
          <span>Voltar para o login</span>
        </RouterLink>
      </div>

      <Form
        v-else
        :key="formKey"
        v-slot="$form"
        :initial-values="initialValues"
        :resolver="resolver"
        :validate-on-value-update="false"
        :validate-on-blur="true"
        class="forgot-password-form"
        @submit="handleSubmit"
      >
        <Message severity="secondary" variant="simple">
          Informe o e-mail da sua conta para receber o link de redefinicao.
        </Message>

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
          <Message
            v-else-if="emailApiError"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ emailApiError }}
          </Message>
        </div>

        <AppButton
          :disabled="!$form.email?.value"
          :loading="isSubmitting"
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
  width: min(100%, 26rem);
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

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 0.82rem;
}
</style>
