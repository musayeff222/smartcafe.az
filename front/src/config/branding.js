/** Marka ve sayfa başlıkları — tek kaynak. */
export const APP_NAME =
  process.env.REACT_APP_APP_NAME?.trim() || 'Smartcafe';

/** Web menyu footer linki */
export const POWERED_BY_URL = 'https://smartcafe.az';
export const POWERED_BY_NAME = 'SmartCafe';

export const titleSuffix = ` | ${APP_NAME}`;

export function pageTitle(part) {
  const p = part?.trim?.() ?? '';
  return p ? `${p}${titleSuffix}` : APP_NAME;
}

/** Backup JSON içindeki meta.format değeri */
export const BACKUP_FORMAT_ID =
  process.env.REACT_APP_BACKUP_FORMAT?.trim() || 'smartcafe-backup';

/** İndirilen yedek dosya adı öneki */
export const BACKUP_FILENAME_PREFIX =
  process.env.REACT_APP_BACKUP_FILE_PREFIX?.trim() || 'smartcafe_backup';
