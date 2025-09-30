<script setup lang="ts">
import Gallery from "@/components/GallerySection.vue";
</script>

<template>
  <header>
    <h1>The Gallery</h1>
    <p>
      The <strong>100 Image</strong> gallery, showcasing the best images from
      <a href="https://unsplash.com" target="_blank">unsplash.com</a>, selected
      by the endpoint's taste.
    </p>
  </header>
  <main><Gallery /></main>
</template>

<style lang="scss" scoped>
header {
  display: grid;
  justify-items: center;
  margin: 3rem 0rem;
  padding: 0rem 0.5rem;

  h1 {
    font-size: var(--fs-800);
    margin-bottom: 1rem;
  }
}
</style>
