# Loomark extension

Save the page you are on to a Loomark collection without leaving it. Built with [WXT](https://wxt.dev), React, and Manifest V3, so one codebase produces a Chrome build and a Firefox build.

There is no store listing yet — you sideload it.

## Install a release build

Every Loomark release attaches prebuilt zips, stamped with that release's version. From the [latest release](https://github.com/carlos-dubon/loomark/releases/latest) take `loomark-extension-<version>-chrome.zip` or `-firefox.zip`.

Chrome and Edge cannot load a zip directly, so unzip it first. Then open `chrome://extensions`, turn on developer mode, choose **Load unpacked**, and pick the unzipped folder.

Firefox 127 or newer is required, for scoped host permissions. Open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and pick the firefox zip. Firefox drops temporary add-ons when it restarts, so you reload it each session unless you sign the build.

## Build it yourself

Requires Node 24 and pnpm. From the repo root, `pnpm install` covers this package too.

```bash
pnpm run ext:build
```

That writes an unpacked extension to `extension/output/chrome-mv3`, which is the folder to load. `pnpm run ext:build:firefox` writes `extension/output/firefox-mv3` alongside it, and there you pick the `manifest.json` inside.

`pnpm run ext:zip` and `pnpm run ext:zip:firefox` produce the same zips CI attaches to a release. The manifest version comes from the root `package.json`, so a local build carries whatever version the checkout is on.

To iterate on the extension itself, `pnpm run ext:dev` launches a browser with it installed and reloads on save.

## First run

The popup asks for your server URL, then your email and password.

The URL step asks the browser for permission to talk to that one origin — the extension ships with no host access at all and requests only the server you name, so the permission prompt is scoped to your instance rather than to every site you visit. Signing in exchanges your password for an API token, which is what the extension stores; your password is never written to disk. Revoke a browser by clicking your email in the popup footer, which deletes that token server side.

## Using it

Open the popup on any page and it prefills the title from the tab. Pick a collection, add notes if you want, and save. The collection you last used is remembered, so the common case is one click; a page you have never sorted lands in Unsorted.

If the page is already in your library the popup opens in edit mode instead: a green check in the bottom right says which collection holds it, the toolbar icon carries a check badge, and you can retitle it, move it to another collection, pin it, or remove it.

The **+** next to the collection picker creates a collection inline — name, icon, and parent, the same options the web app offers — and selects it for the page you are saving.

## What it needs from the server

A Loomark server built from this repo at or after the commit that added the extension. Older instances are missing the `/api/extension/token` endpoint the popup signs in against, the `/api/bookmarks/lookup` endpoint behind the saved check, and the CORS headers that let an extension origin reach the API at all. Upgrading runs the `ApiToken` migration automatically on container start.
