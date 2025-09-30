<script setup lang="ts">
import { ref, onMounted } from "vue";
import { FETCH_IMGS } from "@/constants/error.ts";
import { ENDPOINT_IMGS_LIST } from "@/constants/data.ts";

import axios from "axios";
import ImageThumbnail from "@/components/ImageThumbnail.vue";
import ImageModal from "@/components/ImageModal.vue";

type Img = {
  id: string;
  author: string;
  download_url: string;
  width: number;
  height: number;
};

const images = ref<Img[]>([]);
const selected = ref<Img | null>(null);
const show_modal = ref(false);

onMounted(() => {
  _fetch_images();
});

const _fetch_images = async () => {
  try {
    const url_params = new URLSearchParams(window.location.search);
    const limit = url_params.get("limit") ?? "100";

    const res = await axios.get<Img[]>(`${ENDPOINT_IMGS_LIST}?limit=${limit}`);
    images.value = res.data;
  } catch (err) {
    throw new Error(FETCH_IMGS, { cause: err });
  }
};

const open_image = (img: Img) => {
  selected.value = img;
  show_modal.value = true;
};

const close_modal = () => {
  show_modal.value = false;
  selected.value = null;
};
</script>

<template>
  <main>
    <div class="thumbnail-container">
      <ImageThumbnail
        v-for="img in images"
        :key="img.id"
        :image="img"
        @open="open_image"
      />
    </div>

    <ImageModal :image="selected" :show="show_modal" @close="close_modal" />
  </main>
</template>

<style lang="scss" scoped>
main {
  margin: 3rem 0rem;
}

.thumbnail-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.6rem;
}
</style>
