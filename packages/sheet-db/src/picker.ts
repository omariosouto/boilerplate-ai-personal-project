/**
 * Google Picker, restricted to a single file. Confirming the file in the Picker is what grants the
 * app `drive.file` access to it. https://developers.google.com/drive/picker
 */
const GAPI_SRC = 'https://apis.google.com/js/api.js';

type PickerDoc = { id: string; name?: string };
type PickerResponse = { action: string; docs?: PickerDoc[] };

type PickerNamespace = {
  Action: { PICKED: string; CANCEL: string };
  ViewId: { SPREADSHEETS: string };
  DocsViewMode: { LIST: string };
  DocsView: new (viewId: string) => {
    setFileIds: (fileIds: string) => unknown;
    setMode: (mode: string) => unknown;
  };
  PickerBuilder: new () => PickerBuilder;
};

type PickerBuilder = {
  addView: (view: unknown) => PickerBuilder;
  setOAuthToken: (token: string) => PickerBuilder;
  setDeveloperKey: (key: string) => PickerBuilder;
  setAppId: (appId: string) => PickerBuilder;
  setTitle: (title: string) => PickerBuilder;
  setCallback: (callback: (response: PickerResponse) => void) => PickerBuilder;
  build: () => { setVisible: (visible: boolean) => void };
};

declare global {
  interface Window {
    gapi?: { load: (api: string, callback: () => void) => void };
  }
}

let pickerPromise: Promise<PickerNamespace> | null = null;

function loadPicker() {
  pickerPromise ??= new Promise<PickerNamespace>((resolve, reject) => {
    const onGapi = () =>
      window.gapi!.load('picker', () =>
        resolve((window as unknown as { google: { picker: PickerNamespace } }).google.picker)
      );
    if (window.gapi) return onGapi();
    const script = document.createElement('script');
    script.src = GAPI_SRC;
    script.async = true;
    script.onload = onGapi;
    script.onerror = () => {
      pickerPromise = null;
      reject(new Error('Google Picker failed to load'));
    };
    document.head.appendChild(script);
  });
  return pickerPromise;
}

export async function pickSpreadsheet({
  fileId,
  accessToken,
  apiKey,
  appId,
}: {
  fileId: string;
  accessToken: string;
  apiKey: string;
  appId: string;
}) {
  const picker = await loadPicker();

  return new Promise<void>((resolve, reject) => {
    const view = new picker.DocsView(picker.ViewId.SPREADSHEETS);
    view.setFileIds(fileId);
    view.setMode(picker.DocsViewMode.LIST);

    new picker.PickerBuilder()
      .addView(view)
      .setTitle('Confirm the spreadsheet this app can use')
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setAppId(appId)
      .setCallback((response) => {
        if (response.action === picker.Action.PICKED) {
          if (response.docs?.some((doc) => doc.id === fileId)) resolve();
          else reject(new Error('A different file was selected. Pick the spreadsheet from your link.'));
        } else if (response.action === picker.Action.CANCEL) {
          reject(new Error('Access to the spreadsheet was not granted.'));
        }
      })
      .build()
      .setVisible(true);
  });
}
