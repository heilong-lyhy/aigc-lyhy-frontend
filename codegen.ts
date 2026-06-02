import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../aigc-friendly-backend/src/schema.graphql',
  documents: 'src/**/*.graphql',
  generates: {
    'src/shared/graphql/__generated__/schema-types.ts': {
      plugins: ['typescript'],
      config: {
        enumsAsTypes: true,
        immutableTypes: true,
        skipTypename: true,
        namingConvention: {
          enumValues: 'keep',
        },
        useTypeImports: true,
        scalars: {
          DateTime: 'string',
        },
      },
    },
    'src/shared/graphql/__generated__/operations.ts': {
      preset: 'import-types',
      presetConfig: {
        typesPath: './schema-types',
        onlyOperationTypes: true,
      },
      plugins: ['typescript-operations', 'typed-document-node'],
      config: {
        enumsAsTypes: true,
        immutableTypes: true,
        skipTypename: true,
        namingConvention: {
          enumValues: 'keep',
        },
        useTypeImports: true,
        scalars: {
          DateTime: 'string',
        },
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
