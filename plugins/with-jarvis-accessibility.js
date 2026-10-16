const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SERVICE_NAME = 'com.app.jarvisassistant.automation.JarvisAccessibilityService';

module.exports = function withJarvisAccessibility(config) {
  config = withAndroidManifest(config, (mod) => {
    const app = mod.modResults.manifest.application?.[0];
    if (!app) throw new Error('Jarvis accessibility plugin could not find the Android application manifest.');
    app.service = app.service || [];
    const exists = app.service.some((service) => service.$?.['android:name'] === SERVICE_NAME);
    if (!exists) {
      app.service.push({
        $: {
          'android:name': SERVICE_NAME,
          'android:label': 'Jarvis Accessibility Actions',
          'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [{ action: [{ $: { 'android:name': 'android.accessibilityservice.AccessibilityService' } }] }],
        'meta-data': [{ $: { 'android:name': 'android.accessibilityservice', 'android:resource': '@xml/jarvis_accessibility_service' } }],
      });
    }
    return mod;
  });

  config = withDangerousMod(config, ['android', async (mod) => {
    const root = mod.modRequest.platformProjectRoot;
    const javaDir = path.join(root, 'app/src/main/java/com/app/jarvisassistant/automation');
    const xmlDir = path.join(root, 'app/src/main/res/xml');
    fs.mkdirSync(javaDir, { recursive: true });
    fs.mkdirSync(xmlDir, { recursive: true });
    fs.writeFileSync(path.join(javaDir, 'JarvisAccessibilityService.kt'), SERVICE_SOURCE);
    fs.writeFileSync(path.join(xmlDir, 'jarvis_accessibility_service.xml'), SERVICE_XML);
    return mod;
  }]);

  return config;
};

const SERVICE_XML = `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
  android:accessibilityEventTypes="typeWindowStateChanged|typeWindowContentChanged"
  android:accessibilityFeedbackType="feedbackGeneric"
  android:notificationTimeout="100"
  android:canRetrieveWindowContent="true"
  android:canPerformGestures="false"
  android:description="@string/jarvis_accessibility_description"
  android:accessibilityFlags="flagReportViewIds" />`;

const SERVICE_SOURCE = `package com.app.jarvisassistant.automation

import android.accessibilityservice.AccessibilityService
import android.os.Bundle
import android.view.accessibility.AccessibilityNodeInfo

class JarvisAccessibilityService : AccessibilityService() {
  companion object { @Volatile var instance: JarvisAccessibilityService? = null }

  override fun onServiceConnected() { super.onServiceConnected(); instance = this }
  override fun onDestroy() { if (instance === this) instance = null; super.onDestroy() }
  override fun onAccessibilityEvent(event: android.view.accessibility.AccessibilityEvent?) { /* Intentionally do not log or retain screen content. */ }
  override fun onInterrupt() { }

  fun clickVisibleText(label: String): Boolean {
    val root = rootInActiveWindow ?: return false
    val nodes = root.findAccessibilityNodeInfosByText(label) ?: return false
    for (node in nodes) {
      var target: AccessibilityNodeInfo? = node
      while (target != null) {
        if (target.isClickable && target.isEnabled) return target.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        target = target.parent
      }
    }
    return false
  }

  fun typeIntoLabeledField(label: String, text: String): Boolean {
    val root = rootInActiveWindow ?: return false
    val nodes = root.findAccessibilityNodeInfosByText(label) ?: return false
    for (node in nodes) {
      val candidates = listOfNotNull(node, node.parent, node.parent?.parent)
      val field = candidates.firstOrNull { it.isEditable && it.isEnabled && it.isFocusable } ?: continue
      val args = Bundle().apply { putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text) }
      return field.performAction(AccessibilityNodeInfo.ACTION_FOCUS) &&
        field.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
    }
    return false
  }
}
`;
