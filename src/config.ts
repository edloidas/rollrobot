export const config = {
  token: process.env.TOKEN || '',
  webhookUrl: process.env.WEBHOOK_URL || '',
  port: Number(process.env.PORT) || 3000,
};
