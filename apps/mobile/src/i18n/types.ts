export type Lang = 'en' | 'ar';
export const LANGS: readonly Lang[] = ['en', 'ar'];
export const isRtl = (l: Lang): boolean => l === 'ar';
