package expo.modules.jarvisautomation

import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class JarvisAutomationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("JarvisAutomation")

    AsyncFunction("openAccessibilitySettings") {
      val activity = appContext.currentActivity
        ?: throw IllegalStateException("Jarvis needs an active screen to open Android settings.")
      activity.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
      true
    }

    Function("isAccessibilityServiceEnabled") {
      val context = appContext.reactContext ?: return@Function false
      val enabled = Settings.Secure.getInt(context.contentResolver, Settings.Secure.ACCESSIBILITY_ENABLED, 0) == 1
      if (!enabled) return@Function false
      val services = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: return@Function false
      services.split(':').any { it.contains("JarvisAccessibilityService", ignoreCase = true) }
    }

    AsyncFunction("clickVisibleText") { label: String ->
      require(label.isNotBlank() && label.length <= 100) { "Target text must contain 1-100 characters." }
      val service = JarvisAccessibilityService.instance
        ?: throw IllegalStateException("Enable Jarvis Accessibility in Android Settings first.")
      service.clickVisibleText(label)
    }

    AsyncFunction("typeIntoLabeledField") { label: String, text: String ->
      require(label.isNotBlank() && label.length <= 80) { "Field label must contain 1-80 characters." }
      require(text.length <= 500) { "Text is limited to 500 characters." }
      val blocked = listOf("password", "passcode", "pin", "verification code", "one-time code", "otp", "credit card", "bank account", "payment")
      require(blocked.none { label.contains(it, ignoreCase = true) }) { "For safety, Jarvis will not type into password, verification, payment, or banking fields." }
      val service = JarvisAccessibilityService.instance
        ?: throw IllegalStateException("Enable Jarvis Accessibility in Android Settings first.")
      service.typeIntoLabeledField(label, text)
    }

    AsyncFunction("openApp") { app: String ->
      val activity = appContext.currentActivity
        ?: throw IllegalStateException("Jarvis needs an active screen to open another app.")
      val packages = when (app.lowercase()) {
        "google" -> listOf("com.google.android.googlequicksearchbox")
        "gemini" -> listOf("com.google.android.apps.bard", "com.google.android.apps.gemini")
        "chrome" -> listOf("com.android.chrome")
        "bixby" -> listOf("com.samsung.android.bixby.agent", "com.samsung.android.bixby.service")
        else -> throw IllegalArgumentException("Unsupported app shortcut.")
      }
      val launch = packages.firstNotNullOfOrNull { activity.packageManager.getLaunchIntentForPackage(it) }
      if (launch != null) {
        activity.startActivity(launch)
        true
      } else {
        val fallback = when (app.lowercase()) {
          "google" -> "https://www.google.com/"
          "gemini" -> "https://gemini.google.com/"
          "chrome" -> "https://www.google.com/chrome/"
          else -> "https://www.samsung.com/apps/bixby/"
        }
        activity.startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse(fallback)))
        false
      }
    }

    AsyncFunction("openClock") { kind: String, seconds: Int ->
      require(kind == "alarm" || kind == "timer") { "Clock action must be alarm or timer." }
      val activity = appContext.currentActivity
        ?: throw IllegalStateException("Jarvis needs an active screen to open Clock.")
      val action = if (kind == "timer") android.provider.AlarmClock.ACTION_SET_TIMER else android.provider.AlarmClock.ACTION_SET_ALARM
      val intent = Intent(action)
      if (kind == "timer" && seconds > 0) {
        require(seconds in 1..86400) { "Timer length must be 1-86400 seconds." }
        intent.putExtra(android.provider.AlarmClock.EXTRA_LENGTH, seconds)
        intent.putExtra(android.provider.AlarmClock.EXTRA_SKIP_UI, false)
        intent.putExtra(android.provider.AlarmClock.EXTRA_MESSAGE, "Jarvis focus timer")
      }
      if (intent.resolveActivity(activity.packageManager) == null) {
        throw IllegalStateException("No Clock app accepted the $kind request.")
      }
      activity.startActivity(intent)
      true
    }

    AsyncFunction("setAlarm") { hour: Int, minute: Int, label: String ->
      require(hour in 0..23) { "Alarm hour must be from 0 to 23." }
      require(minute in 0..59) { "Alarm minute must be from 0 to 59." }
      require(label.length <= 80) { "Alarm label must be 80 characters or fewer." }
      val activity = appContext.currentActivity
        ?: throw IllegalStateException("Jarvis needs an active screen to request an alarm.")
      val intent = Intent("android.intent.action.SET_ALARM")
        .putExtra("android.intent.extra.alarm.HOUR", hour)
        .putExtra("android.intent.extra.alarm.MINUTES", minute)
        .putExtra("android.intent.extra.alarm.MESSAGE", label.ifBlank { "Jarvis alarm" })
      if (intent.resolveActivity(activity.packageManager) == null) {
        throw IllegalStateException("No Android Clock app accepted the set-alarm intent.")
      }
      activity.startActivity(intent)
      true
    }

    AsyncFunction("pressBack") {
      val service = JarvisAccessibilityService.instance
        ?: throw IllegalStateException("Enable Jarvis Accessibility in Android Settings first.")
      service.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK)
    }
  }
}
