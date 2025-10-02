// src/composables/use_lazy_load_shared.ts
import { ref, onMounted, onUnmounted } from "vue";

type LazyLoadOptions = {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  groupKey?: string;
};

type ObserverEntry = {
  observer: IntersectionObserver;
  el_map: WeakMap<Element, (src: string) => void>;
  ref_count: number;
};

const _observer_store = new Map<string, ObserverEntry>();

function _make_key(opts?: LazyLoadOptions) {
  const root_margin = opts?.rootMargin ?? "0px";
  const threshold = JSON.stringify(opts?.threshold ?? 0);
  const group_key = opts?.groupKey ?? "";

  return `${root_margin}|${threshold}|${group_key}`;
}

/**
 * Composable for shared lazy loading using Intersection Observer.
 * Keeps one observer per unique config key, shared across elements.
 *
 * @param src - The actual image URL to load when in viewport
 * @param opts - IntersectionObserver options (root, rootMargin, threshold)
 *               and optional groupKey to group observers
 * @returns { image_src, image_ref }
 */
export function use_lazy_load_shared(src: string, opts?: LazyLoadOptions) {
  const image_src = ref<string>("");
  const image_ref = ref<HTMLElement | null>(null);

  let store_key: string | null = null;

  onMounted(() => {
    if (typeof window === "undefined") return; // SSR guard
    if (!image_ref.value) return;

    store_key = _make_key(opts);
    let entry = _observer_store.get(store_key);

    if (!entry) {
      const el_map: WeakMap<Element, (src: string) => void> = new WeakMap();

      const observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;

            const setter = el_map.get(e.target);
            const data_src = (e.target as HTMLElement).dataset?.lazy_src;

            if (setter) {
              setter(data_src ?? src);
            } else if (data_src) {
              // Fallback: if target is <picture>, set <img> inside
              const img = (e.target as HTMLElement).querySelector("img");
              if (img && !img.getAttribute("src")) {
                img.setAttribute("src", data_src);
              }
            }

            observer.unobserve(e.target);
            el_map.delete(e.target);
          }
        },
        {
          root: opts?.root ?? null,
          rootMargin: opts?.rootMargin ?? "0px",
          threshold: opts?.threshold ?? 0,
        },
      );

      entry = { observer, el_map, ref_count: 0 };
      _observer_store.set(store_key, entry);
    }

    // Save desired src in dataset
    (image_ref.value as HTMLElement).dataset =
      (image_ref.value as HTMLElement).dataset || {};
    (image_ref.value as HTMLElement).dataset.lazy_src = src;

    // Reactive setter
    const _set_src = (s: string) => {
      if (image_src.value !== s) image_src.value = s;
    };

    entry.el_map.set(image_ref.value, _set_src);
    entry.ref_count++;
    entry.observer.observe(image_ref.value);
  });

  onUnmounted(() => {
    if (!image_ref.value || !store_key) return;

    const entry = _observer_store.get(store_key);
    if (!entry) return;

    try {
      entry.observer.unobserve(image_ref.value);
    } catch {
      /* ignore */
    }

    entry.ref_count = Math.max(0, entry.ref_count - 1);

    if (entry.ref_count === 0) {
      try {
        entry.observer.disconnect();
      } catch {}
      _observer_store.delete(store_key);
    }
  });

  return { image_src, image_ref };
}
