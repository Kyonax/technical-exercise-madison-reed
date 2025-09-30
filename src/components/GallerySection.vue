<script setup lang="ts">
import { ref, onMounted } from "vue";
import { FETCH_IMGS } from "@/constants/error.ts";
import { ENDPOINT_IMGS_LIST } from "@/constants/data.ts";

import axios from "axios";
// import ImageThumbnail from "@/components/ImageThumbnail.vue";
// import ImageModal from "@/components/ImageModal.vue";

type Img = {
  id: string;
  author: string;
  download_url: string;
  width: number;
  height: number;
};

const images = ref<Img[]>([]);
// const selected = ref<Img | null>(null);

onMounted(() => {
  fetch_images();
});

const fetch_images = async () => {
  try {
    const res = await axios.get<Img[]>(ENDPOINT_IMGS_LIST);
    images.value = res.data;
  } catch (err) {
    throw new Error(FETCH_IMGS, err);
  }
};
</script>

<template>
  <main>
    <div class="thumbnail-container">Thumbnail</div>
  </main>
</template>

<style lang="scss" scoped>
main {
  background-color: var(--clr-base-100);
  margin: 1rem 0rem;
}

.thumbnail-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.5rem;
}
</style>
