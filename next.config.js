const { createVanillaExtractPlugin } = require("@vanilla-extract/next-plugin");

const withVanillaExtract = createVanillaExtractPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["page.ts", "page.tsx"],
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = withVanillaExtract(nextConfig);
