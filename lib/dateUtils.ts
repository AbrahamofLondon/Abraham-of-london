// lib/datesUtil.ts
export * from './date';              // named exports pass-through
import * as DateUtils from './date'; // namespace object
export default DateUtils;            // default export for legacy imports
