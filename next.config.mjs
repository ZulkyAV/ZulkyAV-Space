const isCodespace = process.env.CODESPACES === "true";

const codespaceHost =
  isCodespace &&
  process.env.CODESPACE_NAME &&
  process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
    ? `${process.env.CODESPACE_NAME}-3000.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
    : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    cpus: 1,
    serverActions: {
      allowedOrigins: isCodespace
        ? [
            "localhost:3000",
            ...(codespaceHost ? [codespaceHost] : []),
          ]
        : [],
    },
  },
};

export default nextConfig;
