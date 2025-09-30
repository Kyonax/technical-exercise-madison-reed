import { ref, onMounted } from "vue";

/**
 * Composable for lazy loading images using
 * Intersection Observer (load only on viewport)
 *
 * @param src - The actual image URL
 * @returns { imageSrc, imageRef }
 */
export function use_lazy_load(src: string) {
  const image_src = ref<string>("");
  const image_ref = ref<HTMLImageElement | null>(null);

  onMounted(() => {
    if (!image_ref.value) return;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          image_src.value = src;
          obs.unobserve(entry.target);
        }
      });
    });

    observer.observe(image_ref.value);
  });

  return { image_src, image_ref };
}
