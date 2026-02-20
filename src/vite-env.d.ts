/// <reference types="vite/client" />

declare module "*.mov" {
    const src: string;
    export default src;
}

declare module "*.MOV" {
    const src: string;
    export default src;
}
