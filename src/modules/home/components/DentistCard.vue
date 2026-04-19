<script setup lang="ts">
import { computed } from 'vue'

import Tag from 'primevue/tag'

import type { JobDentist } from '../api'
import {
  buildDentistHighlights,
  buildDentistLegendIcons,
  formatProviderLabel,
  getDentistAddress,
  getDentistAreas,
  getDentistSpecialties,
  hasDentistMetadata,
  hasDentistQualificationLegends,
} from '../utils'

const props = defineProps<{
  dentist: JobDentist
}>()

const address = computed(() => getDentistAddress(props.dentist))
const areas = computed(() => getDentistAreas(props.dentist))
const specialties = computed(() => getDentistSpecialties(props.dentist))
const highlights = computed(() => buildDentistHighlights(props.dentist))
const legendIcons = computed(() => buildDentistLegendIcons(props.dentist))
const hasMetadata = computed(() => hasDentistMetadata(props.dentist))
const hasQualificationLegends = computed(() => hasDentistQualificationLegends(props.dentist))

function getProviderTone(value: string): string {
  if (value === 'odontoprev') {
    return 'provider-tone--odontoprev'
  }

  if (value === 'hapvida') {
    return 'provider-tone--hapvida'
  }

  if (value === 'amil') {
    return 'provider-tone--amil'
  }

  return 'provider-tone--sulamerica'
}
</script>

<template>
  <article class="dentist-card">
    <div class="dentist-card-header">
      <div>
        <h3>{{ dentist.nome }}</h3>
        <p v-if="dentist.nomeFantasia">{{ dentist.nomeFantasia }}</p>
      </div>

      <Tag
        :class="['dentist-provider-tag', getProviderTone(dentist.provider)]"
        :value="formatProviderLabel(dentist.provider)"
        rounded
        severity="secondary"
      />
    </div>

    <div class="dentist-card-body">
      <p v-if="address" class="dentist-line">
        <i class="pi pi-map-marker" aria-hidden="true" />
        <span>{{ address }}</span>
      </p>

      <p v-if="dentist.telefone" class="dentist-line">
        <i class="pi pi-phone" aria-hidden="true" />
        <span>{{ dentist.telefone }}</span>
      </p>

      <p v-if="dentist.whatsapp" class="dentist-line dentist-line--success">
        <i class="pi pi-whatsapp" aria-hidden="true" />
        <span>{{ dentist.whatsapp }}</span>
      </p>

      <p v-if="dentist.email" class="dentist-line">
        <i class="pi pi-envelope" aria-hidden="true" />
        <span>{{ dentist.email }}</span>
      </p>

      <p v-if="dentist.boaconsultaUrl" class="dentist-line">
        <i class="pi pi-external-link" aria-hidden="true" />
        <a :href="dentist.boaconsultaUrl" rel="noreferrer" target="_blank">
          Abrir perfil
        </a>
      </p>
    </div>

    <div class="dentist-card-tags">
      <div v-if="areas.length > 0" class="tag-group">
        <span class="tag-group-label">Area de atuacao</span>
        <div class="tag-group-list">
          <Tag
            v-for="area in areas"
            :key="area"
            :value="area"
            rounded
            severity="info"
          />
        </div>
      </div>

      <div class="tag-group">
        <span class="tag-group-label">Especialidades</span>
        <div class="tag-group-list">
          <Tag
            v-if="specialties.length === 0"
            value="Sem especialidade informada"
            rounded
            severity="secondary"
          />
          <Tag
            v-for="specialty in specialties"
            :key="specialty"
            :value="specialty"
            rounded
            severity="warn"
          />
        </div>
      </div>

      <div v-if="hasMetadata" class="tag-group">
        <span class="tag-group-label">Informacoes</span>
        <div class="tag-group-list">
          <Tag
            v-for="highlight in highlights"
            :key="highlight"
            :value="highlight"
            rounded
            severity="contrast"
          />
          <Tag
            v-if="dentist.acessibilidadeCadeirante"
            value="Acessivel"
            rounded
            severity="info"
          />
        </div>
      </div>

      <div v-if="hasQualificationLegends" class="tag-group">
        <span class="tag-group-label">Legendas</span>
        <div class="dentist-legend-list">
          <span
            v-for="icon in legendIcons"
            :key="`${icon.code}-${icon.label}`"
            :aria-label="icon.label"
            :title="icon.label"
            class="dentist-legend-chip"
          >
            <span class="dentist-legend-glyph">{{ icon.code }}</span>
            <span class="dentist-legend-text">{{ icon.label }}</span>
          </span>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.provider-tone--odontoprev {
  color: var(--app-provider-odontoprev-color);
}

.provider-tone--hapvida {
  color: var(--app-provider-hapvida-color);
}

.provider-tone--amil {
  color: var(--app-provider-amil-color);
}

.provider-tone--sulamerica {
  color: var(--app-provider-sulamerica-color);
}

.dentist-card {
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 72%, transparent);
  border-radius: var(--p-content-border-radius);
  background: var(--app-panel-background);
  box-shadow: var(--app-panel-shadow);
  padding: 1.05rem;
  display: grid;
  gap: 0.95rem;
}

.dentist-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.dentist-card-header h3 {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.35;
  text-transform: uppercase;
}

.dentist-card-header p {
  margin: 0.35rem 0 0;
  color: var(--p-text-muted-color);
  font-size: 0.88rem;
  text-transform: uppercase;
}

.dentist-card-body {
  display: grid;
  gap: 0.45rem;
}

.dentist-line {
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  color: var(--p-text-color);
  line-height: 1.5;
}

.dentist-line--success {
  color: var(--app-success-color);
}

.dentist-line .pi {
  color: var(--p-text-muted-color);
  margin-top: 0.1rem;
}

.dentist-line--success .pi {
  color: var(--app-success-color);
}

.dentist-line a {
  color: var(--p-primary-color);
  text-decoration: none;
  font-weight: 600;
}

.dentist-card-tags {
  display: grid;
  gap: 0.65rem;
}

.tag-group {
  display: grid;
  gap: 0.4rem;
}

.tag-group-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--p-text-muted-color);
}

.tag-group-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dentist-legend-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.dentist-legend-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  padding: 0.35rem 0.6rem 0.35rem 0.35rem;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 72%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-panel-background) 90%, var(--p-surface-100));
}

.dentist-legend-glyph {
  width: 1.8rem;
  height: 1.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.45rem;
  background: color-mix(in srgb, var(--p-text-color) 80%, transparent);
  color: var(--app-panel-background);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
  flex: 0 0 auto;
}

.dentist-legend-text {
  min-width: 0;
  color: var(--p-text-color);
  font-size: 0.82rem;
  line-height: 1.35;
}

@media (max-width: 640px) {
  .dentist-card-header {
    flex-direction: column;
  }
}
</style>
