{
  "compilerOptions": {
    "target": "ES2022",
    "lib": [
      "dom",
      "dom.iterable",
      "es2022"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "src/*",
        "*"
      ],
      "@/components/*": [
        "src/components/*",
        "components/*"
      ],
      "@/lib/*": [
        "src/lib/*",
        "lib/*"
      ],
      "@/types/*": [
        "types/*"
      ],
      "contentlayer/generated": [
        ".contentlayer/generated"
      ]
    },
    "strictNullChecks": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".contentlayer/generated",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "out",
    "public",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx"
  ]
}