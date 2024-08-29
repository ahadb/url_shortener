module.exports = {
  apps: [{
    name: 'deploy-demo',
    script: './src/app.mjs',
    watch: './src',
    env: {
      PORT: 3000,
      NODE_ENV: 'production',
      APP_DEBUG: 1
    },
    node_args: '--experimental-sqlite --env-file=src/.env'
  }]
}