export const DJANGO_PORT=process.env.DJANGO_PORT ? process.env.DJANGO_PORT : "8001"
export const DJANGO_BASE_URL= process.env.DJANGO_BASE_URL ? process.env.DJANGO_BASE_URL : `http://127.0.0.1:${DJANGO_PORT}`
export const DJANGO_API_ENDPOINT=`${DJANGO_BASE_URL}/api`
export const DJANGO_MEDIA_URL=`${DJANGO_BASE_URL}/media/`