/* eslint-disable  @typescript-eslint/no-explicit-any */
import { parseChunkImport } from '@commercetools-frontend/i18n';

const getChunkImport = (_locale: any) => {
  // at present we support only english
  return import(/* webpackChunkName: "app-i18n-en" */ './i18n/data/en.json');
};

const loadMessages = async (locale: any) => {
  try {
    const chunkImport = await getChunkImport(locale);
    return parseChunkImport(chunkImport);
  } catch (error) {
    console.warn(
      `Something went wrong while loading the app messages for ${locale}`,
      error
    );
    return {};
  }
};

export default loadMessages;
