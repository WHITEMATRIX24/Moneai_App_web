import AppConfig from "../models/AppConfig.js";
import FeatureFlag from "../models/FeatureFlag.js";

export async function getPublicConfig(req, res) {
  try {
    const [configs, flags] = await Promise.all([
      AppConfig.find(),
      FeatureFlag.find(),
    ]);

    const settingsDoc = configs.find((c) => c.key === "platform_settings");
    const rawSettings = settingsDoc?.value || {};

    const settings = {
      platformName: rawSettings.platformName || "MONE AI",
      supportEmail: rawSettings.supportEmail || "support@moneai.com",
      defaultCurrency: rawSettings.defaultCurrency || "INR",
      timezone: rawSettings.timezone || "Asia/Kolkata",
      allowUserRegistration: rawSettings.allowUserRegistration !== false,
      maintenanceMode: Boolean(rawSettings.maintenanceMode),
      maintenanceMessage:
        rawSettings.maintenanceMessage ||
        "MONE AI is currently undergoing maintenance. Please try again later.",
      themeColor: rawSettings.themeColor || "#ff6500",
      themeMode: rawSettings.themeMode || "light",
      fontSize: rawSettings.fontSize || 16,
    };

    return res.json({ configs, flags, settings });
  } catch (error) {
    console.error("getPublicConfig error:", error);
    return res.status(500).json({ message: "Failed to get public config" });
  }
}

export async function adminGetConfig(req, res) {
  try {
    const [configs, flags] = await Promise.all([
      AppConfig.find(),
      FeatureFlag.find(),
    ]);

    const settingsDoc = configs.find((c) => c.key === "platform_settings");
    const settings = settingsDoc?.value || {};

    return res.json({ configs, flags, settings });
  } catch (error) {
    console.error("adminGetConfig error:", error);
    return res.status(500).json({ message: "Failed to get admin config" });
  }
}

export async function upsertConfig(req, res) {
  try {
    // If saving platform settings (either as { key: "platform_settings", value: ... }, { settings: ... }, or flat object)
    if (req.body?.key === "platform_settings" || req.body?.settings || (!req.body?.key && typeof req.body === "object")) {
      const existingDoc = await AppConfig.findOne({ key: "platform_settings" });
      const currentVal = (existingDoc?.value && typeof existingDoc.value === "object") ? existingDoc.value : {};
      const newSettings = req.body?.settings || (req.body?.key === "platform_settings" ? req.body.value : req.body);
      const merged = { ...currentVal, ...newSettings };

      const config = await AppConfig.findOneAndUpdate(
        { key: "platform_settings" },
        { value: merged, description: "Platform and Appearance Settings" },
        { new: true, upsert: true }
      );
      return res.json({ success: true, config, settings: config.value });
    }

    const { key, value, description = "" } = req.body;
    if (!key) {
      return res.status(400).json({ message: "Config key is required" });
    }
    const config = await AppConfig.findOneAndUpdate(
      { key },
      { value, description },
      { new: true, upsert: true }
    );
    return res.json(config);
  } catch (error) {
    console.error("upsertConfig error:", error);
    return res.status(500).json({ message: "Failed to update config" });
  }
}

export async function upsertFeatureFlag(req, res) {
  try {
    const { key, enabled, description = "" } = req.body;
    if (!key) {
      return res.status(400).json({ message: "Feature flag key is required" });
    }
    const flag = await FeatureFlag.findOneAndUpdate(
      { key },
      { enabled: Boolean(enabled), description },
      { new: true, upsert: true }
    );
    return res.json(flag);
  } catch (error) {
    console.error("upsertFeatureFlag error:", error);
    return res.status(500).json({ message: "Failed to update feature flag" });
  }
}
