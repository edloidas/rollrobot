export const config = {
  token: process.env.TOKEN || '',
  webhookUrl: process.env.WEBHOOK_URL || '',
  webhookSecret: process.env.WEBHOOK_SECRET || '',
  port: Number(process.env.PORT) || 3000,
};
