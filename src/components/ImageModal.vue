<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from "vue";

type Img = {
  id: string;
  author: string;
  download_url: string;
  width: number;
  height: number;
};

const props = defineProps<{ image: Img | null; show: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const loaded = ref(false);

const _handle_close = () => emit("close");

const _handle_load = () => {
  loaded.value = true;
};

watch(
  () => props.image,
  () => {
    loaded.value = false;
  },
);
</script>

<template>
  <div
    v-if="show && image"
    class="modal"
    tabindex="0"
    @click.self="_handle_close"
  >
    <div class="modal__content">
      <div v-if="!loaded" class="modal__skeleton" />

      <picture>
        <img
          :src="image?.download_url"
          :alt="`Photo by ${image?.author}`"
          loading="eager"
          decoding="async"
          :class="{ 'modal__img--hidden': is_loading }"
          @load="_handle_load"
        />
      </picture>

      <button class="modal__close" @click="_handle_close">&times;</button>
      <p class="modal__author">Photo by {{ image?.author }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3;
  overflow: auto;
  padding: 1rem;

  &__content {
    position: relative;
    max-width: 90%;
    max-height: 90%;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;

    picture {
      position: relative;
      width: 100%;
      max-height: 80vh;

      img {
        max-width: 100%;
        max-height: 80vh;
        object-fit: contain;
        border: 3px solid var(--clr-base-400);
        transition: opacity 0.3s ease-in-out;

        &.modal__img--hidden {
          opacity: 0;
        }
      }
    }

    .modal__skeleton {
      position: relative;
      width: 800px;
      height: 800px;
      background-color: var(--clr-base-400);
      border: 3px solid var(--clr-base-400);
      overflow: hidden;
      z-index: 1;

      @include pulse();
      @include max-media-query(sm) {
        height: 500px;
      }
    }

    .modal__author {
      margin-top: 0.5rem;
      color: var(--clr-base-50);
      font-size: var(--fs-medium-200);
      z-index: 2;
    }

    .modal__close {
      padding: 0.25rem 0.75rem;
      position: absolute;
      top: 0rem;
      right: 0rem;
      font-size: 2rem;
      color: var(--clr-base-50);
      background-color: var(--clr-base-400);
      border: none;
      cursor: pointer;
      transition: color 0.2s ease-in-out;
      z-index: 2;

      &:hover {
        color: var(--clr-primary-100);
      }
    }
  }
}
</style>
