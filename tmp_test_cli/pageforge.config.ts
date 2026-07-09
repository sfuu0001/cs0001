export default {
  components: {
    scan: ['src/components', 'src/ui'],
    exclude: ['**/__tests__/**', '**/*.stories.*'],
  },
  output: {
    dir: 'pages',
    format: 'tsx',
  },
  dev: {
    port: 4000,
  },
}
