import * as dotenv from 'dotenv';

dotenv.config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });

export default {
  api: {
    port: process.env.PORT,
    root: process.env.API_ROOT,
    useSwagger:
      (process.env.USE_SWAGGER && process.env.USE_SWAGGER.toLowerCase() === 'true') || false,
    useCompression:
      (process.env.USE_COMPRESSION && process.env.USE_COMPRESSION.toLowerCase() === 'true') ||
      false,
  },

  db: {
    url: process.env.STORAGE_POSTGRES_URL,
  },
};
