<script setup lang="ts">
import { defineProps, defineEmits, ref } from "vue";
import { ENDPOINT_IMG_BASE } from "@/constants/data.ts";
import { use_lazy_load } from "@/composables/lazy-load.ts";

type Img = {
  id: string;
  author: string;
  download_url: string;
  width: number;
  height: number;
};

const props = defineProps<{ image: Img }>();
const emit = defineEmits<{ (e: "open", image: Img): void }>();

const loaded = ref(false);

const _handle_click = () => {
  emit("open", props.image);
};

const _handle_load = () => {
  loaded.value = true;
};

const _resize_image = (url: string, width: number, height: number) => {
  const id_match = url.match(/\/id\/(\d+)\//);
  if (!id_match) return url;
  const id = id_match[1];
  return `${ENDPOINT_IMG_BASE}/${id}/${width}/${height}`;
};

const { image_src, image_ref } = use_lazy_load(
  _resize_image(props.image.download_url, 500, 500),
);
</script>

<template>
  <div class="thumbnail" @click="_handle_click">
    <div class="thumbnail__img-container" :class="{ loading: !loaded }">
      <div v-if="!loaded" class="thumbnail__skeleton"></div>

      <picture ref="image_ref">
        <source
          :srcset="_resize_image(props.image.download_url, 300, 300)"
          media="(max-width: 600px)"
        />
        <source
          :srcset="_resize_image(props.image.download_url, 500, 500)"
          media="(min-width: 601px)"
        />
        <img
          :src="image_src"
          :alt="`Photo by ${props.image.author}`"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
          @load="_handle_load"
        />
      </picture>

      <p class="index">#{{ props.image.id }}</p>
      <p class="author">by {{ props.image.author }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.thumbnail {
  &__img-container {
    border: 3px solid var(--clr-base-400);
    overflow: hidden;
    position: relative;
    height: 200px;
    transition: border 0.2s ease-in-out;

    picture,
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      background-color: var(--clr-base-300);
      color: var(--clr-base-300);
      z-index: 1;
    }

    &.loading {
      .thumbnail__skeleton {
        @include pulse();
        position: absolute;
        inset: 0;
        border: 3px solid var(--clr-base-400);
        background-color: var(--clr-base-400);
        z-index: 0;
      }
    }

    .author,
    .index {
      background-color: var(--clr-base-400);
      color: var(--clr-base-100);
      letter-spacing: 0rem;
      font-size: var(--fs-100);
      padding: 0.1rem 0.5rem;
      position: absolute;
      z-index: 2; // Above both img and skeleton
      transition:
        background-color 0.2s ease-in-out,
        color 0.2s ease-in-out;
    }

    .author {
      bottom: 0;
    }

    .index {
      top: 0;
      right: 0;
    }
  }

  &__img-container:hover {
    cursor: pointer;
    border: 3px solid var(--clr-primary-100);

    .author,
    .index {
      background-color: var(--clr-primary-100);
      color: var(--clr-base-400);
    }
  }
}
</style>
