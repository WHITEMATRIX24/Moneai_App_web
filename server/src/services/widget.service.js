import WidgetDefinition from "../models/WidgetDefinition.js";
import WidgetLayout from "../models/WidgetLayout.js";

export async function listWidgetDefinitions() {
  return WidgetDefinition.find({
    enabled: true,
  }).sort({ key: 1 });
}

export async function getUserWidgetLayout(userId) {
  return WidgetLayout.findOne({
    userId,
  });
}

export async function saveUserWidgetLayout(userId, widgets) {
  return WidgetLayout.findOneAndUpdate(
    {
      userId,
    },
    {
      widgets,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
}

export async function resetUserWidgetLayout(userId) {
  return WidgetLayout.findOneAndUpdate(
    {
      userId,
    },
    {
      widgets: [],
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
}