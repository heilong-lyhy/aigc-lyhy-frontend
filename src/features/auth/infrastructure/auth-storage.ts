const STORAGE_KEY_ACCESS_TOKEN = 'auth_access_token';
const STORAGE_KEY_REFRESH_TOKEN = 'auth_refresh_token';
const STORAGE_KEY_ACCOUNT_ID = 'auth_account_id';

export function getStoredAuthData() {
  const accessToken = localStorage.getItem(STORAGE_KEY_ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN);
  const accountIdStr = localStorage.getItem(STORAGE_KEY_ACCOUNT_ID);
  const accountId = accountIdStr ? parseInt(accountIdStr, 10) : null;

  return { accessToken, refreshToken, accountId };
}

export function storeAuthData(accessToken: string, refreshToken: string, accountId: number) {
  localStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEY_REFRESH_TOKEN, refreshToken);
  localStorage.setItem(STORAGE_KEY_ACCOUNT_ID, accountId.toString());
}

export function clearStoredAuthData() {
  localStorage.removeItem(STORAGE_KEY_ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEY_REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEY_ACCOUNT_ID);
}