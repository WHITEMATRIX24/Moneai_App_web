import AppConfig from "../models/AppConfig.js";
import FeatureFlag from "../models/FeatureFlag.js";

export async function getPublicConfig(req, res) {
  try {
    const [configs, flags] = await Promise.all([
      AppConfig.find(),
      FeatureFlag.find(),
    ]);
    return res.json({ configs, flags });
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
    // If saving bulk platform settings (e.g. from PlatformSettingsPage)
    if (req.body?.settings || (!req.body?.key && req.body?.themeColor) || (!req.body?.key && req.body?.platformName)) {
      const settingsData = req.body?.settings || req.body;
      const config = await AppConfig.findOneAndUpdate(
        { key: "platform_settings" },
        { value: settingsData, description: "Platform and Appearance Settings" },
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
