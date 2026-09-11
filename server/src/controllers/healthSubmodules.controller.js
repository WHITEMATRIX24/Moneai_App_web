import HealthRecord from "../models/HealthRecord.js";

/**
 * Generic handler to list records for any health submodule
 */
export function listSubmoduleHandler(moduleName) {
  return async (req, res, next) => {
    try {
      const userId = req.auth?.user?._id;
      const records = await HealthRecord.find({
        userId,
        module: moduleName,
      }).sort({ recordedAt: -1, createdAt: -1 });

      const responseKey = moduleName.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const singularKey = moduleName.split("-")[0];

      return res.json({
        success: true,
        records,
        data: records,
        [responseKey]: records,
        [singularKey]: records,
      });
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Generic handler to create a record for any health submodule
 */
export function createSubmoduleHandler(moduleName) {
  return async (req, res, next) => {
    try {
      const userId = req.auth?.user?._id;
      const body = req.body || {};

      const record = await HealthRecord.create({
        userId,
        module: moduleName,
        feature: body.feature || body.name || body.type,
        type: body.type || body.feature,
        name: body.name || body.feature,
        value: body.value,
        unit: body.unit || "",
        recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
        notes: body.notes || "",
        metadata: body.metadata || {},
        data: body,
      });

      const responseKey = moduleName.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const singularKey = moduleName.split("-")[0];

      return res.status(201).json({
        success: true,
        record,
        data: record,
        [responseKey]: record,
        [singularKey]: record,
      });
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Generic handler to delete a record
 */
export async function deleteSubmoduleRecord(req, res, next) {
  try {
    const userId = req.auth?.user?._id;
    const { id } = req.params;

    await HealthRecord.findOneAndDelete({ _id: id, userId });
    return res.json({ success: true, message: "Record deleted successfully." });
  } catch (error) {
    next(error);
  }
}
