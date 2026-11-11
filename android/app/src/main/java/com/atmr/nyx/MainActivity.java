package com.atmr.nyx;

import android.graphics.Color;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

/**
 * Nyx shell. The web client itself lives on the Worker, so everything here is
 * the native floor the client stands on: a dark backdrop, a WebView that lets
 * the speech player start a part without a fresh tap, and no scroll glow.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (getBridge() == null) return;
        WebView webView = getBridge().getWebView();
        if (webView == null) return;

        webView.setBackgroundColor(Color.parseColor("#08080c"));
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);

        WebSettings settings = webView.getSettings();
        // The player unlocks on the first tap in the client; later parts of the
        // same reply must be allowed to start on their own (progressive TTS).
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setUseWideViewPort(false);
        settings.setLoadWithOverviewMode(false);
        // System font scaling must not reflow the phone-first layout.
        settings.setTextZoom(100);
    }
}