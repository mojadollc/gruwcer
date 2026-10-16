module.exports = {
  apps: [{
    name: "gruwcer",
    script: "node_modules/.bin/next",
    args: "start",
    cwd: "/var/www/gruwcer",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      PORT: 3004,
    },
    max_memory_restart: "512M",
    error_file: "/var/log/pm2/gruwcer-error.log",
    out_file: "/var/log/pm2/gruwcer-out.log",
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss",
  }]
}
