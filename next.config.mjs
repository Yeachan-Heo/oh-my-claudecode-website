import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  turbopack: {
    root: '.',
  },
};

export default withMDX(config);
