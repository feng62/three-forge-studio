/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare const __LOCAL_PUBLISH_AVAILABLE__: boolean;
