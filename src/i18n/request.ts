import {getRequestConfig} from 'next-intl/server';
import {cookies, headers} from "next/headers";

const locales: string[] = ['en', 'fr'] as const;
const defaultLocale = 'en';

async function getLocaleFromHeaders() {
    const headerStore = await headers();
    const acceptLanguage = headerStore.get('accept-language');
    if (!acceptLanguage) return defaultLocale;

    const preferred = acceptLanguage
        .split(',')
        .map((part) => part.split(';')[0].trim().split('-')[0]);

    return preferred.find((lang) => locales.includes(lang)) ?? defaultLocale;
}

export default getRequestConfig(async () => {
    const store = await cookies();
    const locale = store.get('app-lang')?.value || (await getLocaleFromHeaders());

    return {
        locale,
        messages: (await import(`./lang/${locale}.json`)).default
    };
});