function setupProxy({ tls }) {
  const conf = [
    {
      context: ['/api', '/services', '/management', '/v3/api-docs', '/h2-console', '/auth', '/health', '/oauth2', '/login', '/logout'],
      target: `http${tls ? 's' : ''}://localhost:8008`,
      secure: false,
      changeOrigin: tls,
    },
  ];
  return conf;
}

module.exports = setupProxy;
