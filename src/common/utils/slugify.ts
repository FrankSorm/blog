import slugifyLib from 'slugify';
export const slugify = (text: string) => slugifyLib(text, { lower: true, strict: true, trim: true });
