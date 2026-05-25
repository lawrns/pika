const REQUIRED_IN_PRODUCTION = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET'];

export function validateEnvironment(env = process.env) {
  const missing = [];

  if (env.NODE_ENV === 'production') {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!env[key]) missing.push(key);
    }
  }

  if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
    missing.push('JWT_SECRET_MIN_32_CHARS');
  }

  return {
    ok: missing.length === 0,
    missing
  };
}

export function assertEnvironment(env = process.env) {
  const result = validateEnvironment(env);
  if (!result.ok) {
    throw new Error(`Invalid Pika backend environment: ${result.missing.join(', ')}`);
  }
  return result;
}
