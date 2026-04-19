<script setup lang="ts">
import { computed } from 'vue'

import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'

import type { SelectOption } from '../api'
import ProviderLoadErrorMessage from './ProviderLoadErrorMessage.vue'

const props = defineProps<{
  acessibilidade: boolean
  codigoEspecialidade: string
  codigoPlano: string
  codigoRede: string
  especialidades: SelectOption[]
  idioma: string
  isAtendeWhatsApp: boolean
  isEspecialista: boolean
  isLoading: boolean
  loadError: string
  nomeDentista: string
  planos: SelectOption[]
  redes: SelectOption[]
  selectionError: string
}>()

const emit = defineEmits<{
  networkChange: [value: string | null]
  planChange: [value: string | null]
  retry: []
  'update:acessibilidade': [value: boolean]
  'update:codigoEspecialidade': [value: string]
  'update:idioma': [value: string]
  'update:isAtendeWhatsApp': [value: boolean]
  'update:isEspecialista': [value: boolean]
  'update:nomeDentista': [value: string]
}>()

const codigoEspecialidadeModel = computed({
  get: () => props.codigoEspecialidade,
  set: (value: string) => emit('update:codigoEspecialidade', value),
})

const nomeDentistaModel = computed({
  get: () => props.nomeDentista,
  set: (value: string) => emit('update:nomeDentista', value),
})

const idiomaModel = computed({
  get: () => props.idioma,
  set: (value: string) => emit('update:idioma', value),
})

const isEspecialistaModel = computed({
  get: () => props.isEspecialista,
  set: (value: boolean) => emit('update:isEspecialista', value),
})

const isAtendeWhatsAppModel = computed({
  get: () => props.isAtendeWhatsApp,
  set: (value: boolean) => emit('update:isAtendeWhatsApp', value),
})

const acessibilidadeModel = computed({
  get: () => props.acessibilidade,
  set: (value: boolean) => emit('update:acessibilidade', value),
})
</script>

<template>
  <Card class="provider-panel">
    <template #content>
      <div class="provider-panel-body">
        <div class="provider-panel-header">
          <div>
            <h2>Filtros OdontoPrev</h2>
            <p>Escolha exatamente uma rede ou um plano e complete os filtros opcionais.</p>
          </div>
          <Tag class="provider-tone--odontoprev" rounded severity="secondary" value="OdontoPrev" />
        </div>

        <ProviderLoadErrorMessage :is-retrying="isLoading" :message="loadError" @retry="emit('retry')" />

        <div class="provider-fields-grid">
          <div class="provider-field provider-field--full">
            <label for="odontoprev-rede">Rede</label>
            <Select
              input-id="odontoprev-rede"
              :disabled="Boolean(codigoPlano)"
              :invalid="Boolean(selectionError)"
              :loading="isLoading"
              :model-value="codigoRede || null"
              :options="redes"
              option-label="nome"
              option-value="codigo"
              placeholder="Selecione a rede"
              show-clear
              @update:model-value="emit('networkChange', $event)"
            />
          </div>

          <div class="provider-field provider-field--full">
            <label for="odontoprev-plano">Plano</label>
            <Select
              input-id="odontoprev-plano"
              :disabled="Boolean(codigoRede)"
              :invalid="Boolean(selectionError)"
              :loading="isLoading"
              :model-value="codigoPlano || null"
              :options="planos"
              option-label="nome"
              option-value="codigo"
              placeholder="Selecione o plano"
              show-clear
              @update:model-value="emit('planChange', $event)"
            />
          </div>
        </div>

        <div v-if="selectionError" class="provider-inline-errors">
          <small>{{ selectionError }}</small>
        </div>

        <details class="provider-subsection provider-subsection--collapsible">
          <summary class="provider-subsection-summary">
            <div class="provider-subsection-title">
              <span aria-hidden="true" class="provider-subsection-title-line" />
              <h3>Filtros opcionais</h3>
            </div>
            <i aria-hidden="true" class="pi pi-chevron-down provider-subsection-chevron" />
          </summary>

          <div class="provider-subsection-content">
            <div class="provider-subsection-copy">
              <p>Refine a busca com criterios complementares sem alterar UF e municipio.</p>
            </div>

            <div class="provider-fields-grid">
              <div class="provider-field">
                <label for="odontoprev-especialidade">Especialidade</label>
                <Select
                  v-model="codigoEspecialidadeModel"
                  input-id="odontoprev-especialidade"
                  :loading="isLoading"
                  :options="especialidades"
                  option-label="nome"
                  option-value="codigo"
                  placeholder="Especialidade"
                  show-clear
                />
              </div>

              <div class="provider-field">
                <label for="odontoprev-nome">Nome do dentista</label>
                <InputText
                  v-model="nomeDentistaModel"
                  id="odontoprev-nome"
                  placeholder="Digite o nome do dentista"
                />
              </div>

              <div class="provider-field">
                <label for="odontoprev-idioma">Idioma</label>
                <InputText v-model="idiomaModel" id="odontoprev-idioma" placeholder="Ex.: INGLES" />
              </div>
            </div>

            <div class="provider-binary-grid">
              <label class="binary-option" for="odontoprev-especialista">
                <Checkbox
                  v-model="isEspecialistaModel"
                  binary
                  input-id="odontoprev-especialista"
                />
                <span>Somente especialista</span>
              </label>

              <label class="binary-option" for="odontoprev-whatsapp">
                <Checkbox
                  v-model="isAtendeWhatsAppModel"
                  binary
                  input-id="odontoprev-whatsapp"
                />
                <span>Atende WhatsApp</span>
              </label>

              <label class="binary-option" for="odontoprev-acessibilidade">
                <Checkbox
                  v-model="acessibilidadeModel"
                  binary
                  input-id="odontoprev-acessibilidade"
                />
                <span>Acessibilidade</span>
              </label>
            </div>
          </div>
        </details>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.provider-tone--odontoprev {
  color: var(--app-provider-odontoprev-color);
}

.provider-panel {
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 65%, transparent);
  box-shadow: var(--app-panel-shadow);
}

.provider-panel :deep(.p-card-body) {
  gap: 0;
}

.provider-panel-body {
  display: grid;
  gap: 0.95rem;
}

.provider-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.provider-panel-header h2 {
  margin: 0;
  font-size: 1rem;
}

.provider-panel-header p {
  margin: 0.35rem 0 0;
  color: var(--p-text-muted-color);
  line-height: 1.55;
}

.provider-fields-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.provider-field {
  display: grid;
  gap: 0.4rem;
  min-width: 0;
}

.provider-field label {
  color: var(--p-text-muted-color);
  font-size: 0.88rem;
  font-weight: 600;
}

.provider-field--full {
  grid-column: 1 / -1;
}

.provider-field :deep(.p-select),
.provider-field :deep(.p-inputtext) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.provider-field :deep(.p-select) {
  overflow: hidden;
}

.provider-field :deep(.p-select-label) {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.provider-subsection {
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 50%, transparent);
  border-radius: var(--p-content-border-radius);
  background: var(--app-panel-background-soft);
}

.provider-subsection-copy {
  display: grid;
  gap: 0.45rem;
}

.provider-subsection--collapsible {
  gap: 0;
  padding: 0.95rem 1rem 1rem;
}

.provider-subsection-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  cursor: pointer;
  list-style: none;
}

.provider-subsection-summary::-webkit-details-marker {
  display: none;
}

.provider-subsection-title {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.provider-subsection-title-line {
  width: 1.45rem;
  height: 1px;
  background: color-mix(in srgb, var(--p-text-color) 78%, transparent);
  flex: 0 0 auto;
}

.provider-subsection-title h3 {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.2;
}

.provider-subsection-copy p {
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 0.88rem;
  line-height: 1.55;
}

.provider-subsection-content {
  display: grid;
  gap: 0.9rem;
  padding-top: 0.9rem;
}

.provider-subsection-chevron {
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
  transition: transform 0.2s ease;
}

.provider-subsection--collapsible[open] .provider-subsection-chevron {
  transform: rotate(180deg);
}

.provider-binary-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.binary-option {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--p-text-color);
  font-size: 0.92rem;
}

.provider-inline-errors {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}

.provider-inline-errors small {
  color: var(--p-red-500);
  line-height: 1.5;
}

@media (max-width: 640px) {
  .provider-fields-grid {
    grid-template-columns: 1fr;
  }

  .provider-panel-header {
    flex-direction: column;
  }

  .provider-field--full {
    grid-column: auto;
  }
}
</style>
