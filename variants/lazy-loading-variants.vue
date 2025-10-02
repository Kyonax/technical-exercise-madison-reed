<script setup lang="ts"></script>

<template>
  <h2>Native HTML Lazy Loading</h2>
  <img
    src="https://picsum.photos/id/1015/800/400"
    loading="lazy"
    alt="Lazy image"
  />
  <img
    src="https://picsum.photos/id/1020/800/400"
    loading="lazy"
    alt="Another lazy image"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

function useLazyLoad(src: string) {
  const imageSrc = ref<string>("");
  const imageRef = ref<HTMLImageElement | null>(null);

  onMounted(() => {
    if (!imageRef.value) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            imageSrc.value = src;
            obs.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "100px", // preload 100px before viewport
      },
    );

    observer.observe(imageRef.value);
  });

  return { imageSrc, imageRef };
}

const { imageSrc, imageRef } = useLazyLoad(
  "https://picsum.photos/id/1030/800/400",
);
</script>

<template>
  <h2>IntersectionObserver Lazy Loading</h2>
  <div
    class="relative w-[800px] h-[400px] bg-gray-200 flex items-center justify-center"
  >
    <span v-if="!imageSrc">Loading...</span>
    <img
      :src="imageSrc"
      ref="imageRef"
      alt="Lazy loaded"
      class="absolute inset-0 w-full h-full object-cover"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RecycleScroller } from "vue-virtual-scroller";

const items = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  src: `https://picsum.photos/id/${i % 100}/400/200`,
}));
</script>

<template>
  <h2>Virtualized List with Lazy Images</h2>
  <RecycleScroller
    :items="items"
    :item-size="220"
    key-field="id"
    class="scroller"
  >
    <template #default="{ item }">
      <img :src="item.src" loading="lazy" class="block w-full h-[200px]" />
    </template>
  </RecycleScroller>
</template>

<style>
.scroller {
  height: 500px;
  overflow-y: auto;
}
</style>


//

// src/composables/useSharedLazyLoad.ts
import { ref, onMounted, onUnmounted } from "vue";

type Options = {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  /**
   * Optional group key to separate observers when you have multiple scroll containers
   * or different preloading policies. If not provided, rootMargin+threshold form the key.
   */
  groupKey?: string;
};

type ObserverEntry = {
  observer: IntersectionObserver;
  elMap: WeakMap<Element, (s: string) => void>;
  refCount: number; // number of elements currently registered
};

const store = new Map<string, ObserverEntry>();

function makeStoreKey(opts?: Options) {
  const rm = opts?.rootMargin ?? "0px";
  const th = JSON.stringify(opts?.threshold ?? 0);
  const gk = opts?.groupKey ?? "";
  // Note: not serializing root element; provide groupKey if you need per-root observers.
  return `${rm}|${th}|${gk}`;
}

/**
 * Shared lazy load composable — one observer per config key
 * @param src final image src to set when visible
 * @param opts IntersectionObserver options (rootMargin/threshold) and optional groupKey
 */
export function useSharedLazyLoad(src: string, opts?: Options) {
  const imageSrc = ref<string>(""); // reactive bound to <img :src="imageSrc">
  const elRef = ref<HTMLElement | null>(null);

  let key: string | null = null;

  onMounted(() => {
    // SSR guard
    if (typeof window === "undefined") return;
    if (!elRef.value) return;

    key = makeStoreKey(opts);
    let entry = store.get(key);

    if (!entry) {
      const elMap: WeakMap<Element, (s: string) => void> = new WeakMap();

      const observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              const setter = elMap.get(e.target);
              // try reading a data-attr fallback if setter missing (defensive)
              const dataSrc = (e.target as HTMLElement).dataset?.lazySrc;
              if (setter) {
                setter(dataSrc ?? src);
              } else if (dataSrc) {
                // fallback: set any <img> inside target (useful if someone observed <picture>)
                const img = (e.target as HTMLElement).querySelector('img');
                if (img && !img.getAttribute('src')) img.setAttribute('src', dataSrc);
              }
              observer.unobserve(e.target);
              elMap.delete(e.target);
              // We don't update refCount here; the registering side will decrement onUnmounted/unregister.
            }
          }
        },
        {
          root: opts?.root ?? null,
          rootMargin: opts?.rootMargin ?? "0px",
          threshold: opts?.threshold ?? 0,
        }
      );

      entry = { observer, elMap, refCount: 0 };
      store.set(key, entry);
    }

    // store the desired src on the element so the observer callback can access it
    (elRef.value as HTMLElement).dataset = (elRef.value as HTMLElement).dataset || {};
    (elRef.value as HTMLElement).dataset.lazySrc = src;

    // setter writes to this composable's reactive ref
    const setter = (s: string) => {
      // idempotent: only set if empty or changed
      if (imageSrc.value !== s) imageSrc.value = s;
    };

    entry.elMap.set(elRef.value, setter);
    entry.refCount++;
    entry.observer.observe(elRef.value);
  });

  onUnmounted(() => {
    if (!elRef.value || !key) return;
    const entry = store.get(key);
    if (!entry) return;

    try {
      entry.observer.unobserve(elRef.value);
    } catch {
      /* ignore */
    }

    // Clean slot in WeakMap if any: we cannot iterate WeakMap, but we did `elMap.delete` when intersecting.
    entry.refCount = Math.max(0, entry.refCount - 1);

    if (entry.refCount === 0) {
      // No more observed elements for this observer — disconnect and remove
      try {
        entry.observer.disconnect();
      } catch {}
      store.delete(key);
    }
  });

  return { imageSrc, elRef };
}


// inside ImageThumbnail.vue <script setup>
import { useSharedLazyLoad } from "@/composables/useSharedLazyLoad";

const { imageSrc, elRef } = useSharedLazyLoad(
  _resize_image(props.image.download_url, 500, 500),
  { rootMargin: "150px", groupKey: "gallery-default" }
);
