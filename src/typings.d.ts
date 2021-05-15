declare namespace NodeJS {
  export interface ProcessEnv {
    BOT_TOKEN: string;
    BITQUERY_API_KEY: string;
    MESSAGE_TEMPLATE_PATH?: string;
  }
}
