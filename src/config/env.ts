import dotenv from 'dotenv';

dotenv.config();

interface Env {
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

function getEnv(): Env {
  const { PORT, MONGODB_URI, JWT_SECRET, NODE_ENV } = process.env;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is required but not set in environment variables');
  }
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required but not set in environment variables');
  }

  const port = PORT ? parseInt(PORT, 10) : 3000;
  if (isNaN(port)) {
    throw new Error('PORT must be a valid number');
  }

  const env = NODE_ENV as Env['NODE_ENV'];
  if (env && !['development', 'production', 'test'].includes(env)) {
    throw new Error('NODE_ENV must be one of: development, production, test');
  }

  return {
    PORT: port,
    MONGODB_URI,
    JWT_SECRET,
    NODE_ENV: env || 'development',
  };
}

export const env = getEnv();
