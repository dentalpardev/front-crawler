<script setup lang="ts">
import ArchitectureCard from '../components/ArchitectureCard.vue'

const architectureSections = [
  {
    title: 'App',
    path: 'src/app',
    description:
      'Concentra o bootstrap do frontend, o shell da aplicacao e o router principal que registra apenas contratos publicos dos modulos.',
  },
  {
    title: 'Modules',
    path: 'src/modules/home',
    description:
      'Cada dominio passa a ser dono das proprias paginas, componentes, estado e integracoes, sem acessar internals de outros modulos.',
  },
  {
    title: 'Shared',
    path: 'src/shared',
    description:
      'Agrupa recursos neutros e reutilizaveis, como cliente HTTP, utilitarios, tipos e componentes realmente genericos.',
  },
] as const
</script>

<template>
  <main class="home-page">
    <section class="hero">
      <p class="eyebrow">Arquitetura Modular</p>
      <h1>Base modular pronta para crescer</h1>
      <p class="lead">
        O frontend agora nasce organizado em camadas claras para facilitar evolucao,
        ownership por dominio e compartilhamento controlado.
      </p>
    </section>

    <section class="cards" aria-label="Estrutura principal do projeto">
      <ArchitectureCard
        v-for="section in architectureSections"
        :key="section.path"
        :title="section.title"
        :path="section.path"
        :description="section.description"
      />
    </section>
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family:
    'IBM Plex Sans',
    'Segoe UI',
    sans-serif;
  background:
    radial-gradient(circle at top, rgba(125, 211, 252, 0.35), transparent 32%),
    linear-gradient(180deg, #f8fbff 0%, #eef4f8 100%);
  color: #102a43;
}

:global(*) {
  box-sizing: border-box;
}

.home-page {
  min-height: 100vh;
  padding: 4rem 1.5rem;
}

.hero,
.cards {
  width: min(1080px, 100%);
  margin: 0 auto;
}

.hero {
  margin-bottom: 2.5rem;
}

.eyebrow {
  margin: 0 0 1rem;
  color: #0f766e;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero h1 {
  margin: 0;
  max-width: 12ch;
  font-size: clamp(2.75rem, 7vw, 4.75rem);
  line-height: 0.95;
}

.lead {
  margin: 1.25rem 0 0;
  max-width: 44rem;
  font-size: 1.1rem;
  line-height: 1.75;
  color: #334e68;
}

.cards {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

@media (max-width: 640px) {
  .home-page {
    padding: 3rem 1rem;
  }

  .hero h1 {
    max-width: none;
  }
}
</style>
