import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  // 1. Chỉ quét các file trong thư mục src
  { files: ['src/**/*.ts'] },

  // 2. Báo cho ESLint biết đây là môi trường Node.js (để nó không báo lỗi chữ 'process')
  { languageOptions: { globals: globals.node } },

  // 3. Kế thừa các luật chuẩn quốc tế
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,

  // 4. THIẾT QUÂN LUẬT CỦA TECH LEAD VÀ BẠN (Cấm any)
  {
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error', // Bật chế độ TỬ HÌNH với chữ any
    },
  },
];
