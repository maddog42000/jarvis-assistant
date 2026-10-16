package expo.modules.jarvisautomation

import android.accessibilityservice.AccessibilityService
import android.os.Bundle
import android.view.accessibility.AccessibilityNodeInfo

class JarvisAccessibilityService : AccessibilityService() {
  companion object {
    @Volatile var instance: JarvisAccessibilityService? = null
  }

  override fun onServiceConnected() {
    super.onServiceConnected()
    instance = this
  }

  override fun onDestroy() {
    if (instance === this) instance = null
    super.onDestroy()
  }

  override fun onAccessibilityEvent(event: android.view.accessibility.AccessibilityEvent?) {
    // Do not log or retain screen content.
  }

  override fun onInterrupt() = Unit

  fun clickVisibleText(label: String): Boolean {
    val root = rootInActiveWindow ?: return false
    val nodes = root.findAccessibilityNodeInfosByText(label) ?: return false
    for (node in nodes) {
      var target: AccessibilityNodeInfo? = node
      while (target != null) {
        if (target.isClickable && target.isEnabled) {
          return target.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        }
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
      val args = Bundle().apply {
        putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
      }
      return field.performAction(AccessibilityNodeInfo.ACTION_FOCUS) &&
        field.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
    }
    return false
  }
}
