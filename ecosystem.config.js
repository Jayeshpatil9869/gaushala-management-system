module.exports = {
  apps: [
    {
      name: "gaushala",
      script: "npm",
      args: "start -- -p 3050",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        PORT: 3050,
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
};
