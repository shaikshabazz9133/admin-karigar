// The session is the API's access token, kept in an httpOnly cookie so browser code never sees it.
export const TOKEN_COOKIE = "hk_token";
export const EMAIL_COOKIE = "hk_email";
// Set in sessionStorage at sign-in. It dies with the tab, so a fresh tab with a leftover cookie gets signed out.
export const TAB_KEY = "hk_tab";
