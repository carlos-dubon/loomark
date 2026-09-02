export const NEW_TAB_COOKIE_NAME = "loomark_new_tab"

export const NEW_TAB_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const toOpenInNewTab = (value: string | undefined) => value !== "false"
