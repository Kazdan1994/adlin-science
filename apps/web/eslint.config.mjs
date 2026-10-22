import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // User-supplied text must go through Vue's escaping (constitution Principle II).
    'vue/no-v-html': 'error',
  },
})
