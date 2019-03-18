/*
 * Stimulus-GooglePicker
 *
 * Copyright (C) 2019 Boris Raicheff
 * All rights reserved
 */


import { Controller } from "stimulus";


// https://developers.google.com/picker
// https://developers.google.com/drive/api/v3/picker


export default class extends Controller {

  connect() {

    window._gapi_init = () => {
      gapi.load("auth:picker", { "callback": this._onGapiLoad.bind(this) });
      delete window._gapi_init;
    };

    const script = document.createElement("script");
    [script.id, script.src] = ["google-api", "https://apis.google.com/js/api.js?onload=_gapi_init"];

    const ref = document.getElementsByTagName("script")[0];
    ref.parentNode.insertBefore(script, ref);

  }

  disconnect() {

    const element = document.getElementById("google-api");
    element.parentNode.removeChild(element);

  }

  pick(event) {

    const config = {
      "client_id": this.data.get("clientId"),
      "scope":     ["https://www.googleapis.com/auth/drive.file"],
      "immediate": false,
    };

    gapi.auth.authorize(config, this._onAuthorizeResponse.bind(this));

    this.element.disabled = true;

  }

  _onGapiLoad() {

    this.element.disabled = false;

  }

  _onAuthorizeResponse(response) {

    if (response.error) {
      console.error(response.error);
      this.element.disabled = false;
      return;
    }

    this._createPicker(response.access_token);

  }

  _createPicker(accessToken) {

    const view = new google.picker.DocsView();

    // mimetypes
    const mimeTypes = this.data.get("mimetypes");
    if (mimeTypes) {
      view.setMimeTypes(mimeTypes.split(" ").join(","));
    }

    const picker = new google.picker.PickerBuilder()
      .setAppId(this.data.get("appId"))
      .setDeveloperKey(this.data.get("apiKey"))
      .setOAuthToken(accessToken)
      .setCallback(this._pickerCallback.bind(this, accessToken))
      .enableFeature(google.picker.Feature.NAV_HIDDEN)
      .addView(view)
      .build();
    picker.setVisible(true);

  }

  _pickerCallback(accessToken, data) {

    if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
      const event = new CustomEvent("pick", { detail: { data: data, accessToken: accessToken } });
      this.element.dispatchEvent(event);
    }

    this.element.disabled = false;

  }

}


/* EOF */
