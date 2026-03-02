// scripts/pdf/file-pdf-converter/converters/index.ts
import { ExcelConverter } from "./excel-converter";
import { PowerpointConverter } from "./powerpoint-converter";
import { WordConverter } from "./word-converter";
import { CopyConverter } from "./copy-converter";
import { TextConverter } from "./text-converter";
import { CsvConverter } from "./csv-converter";

export const CONVERTERS = {
  excel: new ExcelConverter(),
  powerpoint: new PowerpointConverter(),
  word: new WordConverter(),
  copy: new CopyConverter(),
  text: new TextConverter(),
  csv: new CsvConverter(),
} as const;

export type ConverterKey = keyof typeof CONVERTERS;