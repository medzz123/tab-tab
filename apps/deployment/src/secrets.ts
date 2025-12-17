import { defineSecrets } from './resources/secret';

export const secrets = defineSecrets({
  secrets: {
    GEMINI_API_KET: { name: 'gemini-api-key', defaultValue: 'placeholder-value' },
  },
});
