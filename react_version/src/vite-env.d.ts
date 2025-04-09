/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly STRAPI_UPLOAD_TOKEN: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}