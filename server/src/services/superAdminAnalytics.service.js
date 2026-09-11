import AnalyticsEvent from "../models/AnalyticsEvent.js";
import User from "../models/User.js";


/* ==========================================================================
   DATE HELPERS
========================================================================== */

function getDateRange(query = {}) {
  const now = new Date();

  if (
    typeof query === "object" &&
    String(query?.date || "").toLowerCase() === "yesterday"
  ) {
    const startDate = new Date(now);

    startDate.setDate(
      startDate.getDate() - 1
    );

    startDate.setHours(
      0,
      0,
      0,
      0
    );

    const endDate = new Date(startDate);

    endDate.setDate(
      endDate.getDate() + 1
    );

    return {
      startDate,
      endDate,
      days: 1,
    };
  }

  let days =
    typeof query === "number"
      ? Number(query)
      : Number(query?.days);

  if (
    !Number.isFinite(days) ||
    days <= 0
  ) {
    days = 30;
  }

  days = Math.min(
    Math.floor(days),
    365
  );

  const startDate = new Date(now);

  startDate.setDate(
    startDate.getDate() -
      (days - 1)
  );

  startDate.setHours(
    0,
    0,
    0,
    0
  );

  return {
    startDate,
    endDate: now,
    days,
  };
}


/* ==========================================================================
   COMMON FILTER
========================================================================== */

function activityFilter(
  startDate,
  endDate
) {
  return {
    timestamp: {
      $gte: startDate,
      $lt: endDate,
    },

    userId: {
      $exists: true,
      $ne: null,
    },
  };
}


/* ==========================================================================
   USER HELPERS
========================================================================== */

async function countRegisteredUsers() {
  return User.countDocuments({
    status: {
      $ne: "DELETED",
    },
  });
}


async function countNewUsers(
  startDate,
  endDate
) {
  return User.countDocuments({
    createdAt: {
      $gte: startDate,
      $lt: endDate,
    },

    status: {
      $ne: "DELETED",
    },
  });
}


async function countReturningUsers(
  activeUserIds,
  startDate
) {
  if (
    !activeUserIds ||
    activeUserIds.length === 0
  ) {
    return 0;
  }

  return User.countDocuments({
    _id: {
      $in: activeUserIds,
    },

    createdAt: {
      $lt: startDate,
    },

    status: {
      $ne: "DELETED",
    },
  });
}


/* ==========================================================================
   DAU / WAU / MAU HELPERS
========================================================================== */

async function getDailyActiveUsers(
  endDate
) {
  const start = new Date(endDate);

  start.setHours(
    0,
    0,
    0,
    0
  );

  return AnalyticsEvent.distinct(
    "userId",
    {
      timestamp: {
        $gte: start,
        $lt: endDate,
      },

      userId: {
        $exists: true,
        $ne: null,
      },
    }
  );
}


async function getWeeklyActiveUsers(
  endDate
) {
  const start = new Date(endDate);

  start.setDate(
    start.getDate() - 6
  );

  start.setHours(
    0,
    0,
    0,
    0
  );

  return AnalyticsEvent.distinct(
    "userId",
    {
      timestamp: {
        $gte: start,
        $lt: endDate,
      },

      userId: {
        $exists: true,
        $ne: null,
      },
    }
  );
}


async function getMonthlyActiveUsers(
  endDate
) {
  const start = new Date(endDate);

  start.setDate(
    start.getDate() - 29
  );

  start.setHours(
    0,
    0,
    0,
    0
  );

  return AnalyticsEvent.distinct(
    "userId",
    {
      timestamp: {
        $gte: start,
        $lt: endDate,
      },

      userId: {
        $exists: true,
        $ne: null,
      },
    }
  );
}


/* ==========================================================================
   RETENTION HELPER
========================================================================== */

async function calculateRetention(
  startDate,
  endDate
) {
  const cohortUsers =
    await User.find(
      {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },

        status: {
          $ne: "DELETED",
        },
      },
      {
        _id: 1,
        createdAt: 1,
      }
    ).lean();


  if (
    cohortUsers.length === 0
  ) {
    return {
      cohortSize: 0,
      retainedUsers: 0,
      retentionRate: 0,
    };
  }


  const userIds =
    cohortUsers.map(
      (user) =>
        user._id
    );


  const retainedUsers =
    await AnalyticsEvent.distinct(
      "userId",
      {
        userId: {
          $in: userIds,
        },

        timestamp: {
          $gte: startDate,
          $lt: endDate,
        },
      }
    );


  const retentionRate =
    (
      retainedUsers.length /
      cohortUsers.length
    ) * 100;


  return {
    cohortSize:
      cohortUsers.length,

    retainedUsers:
      retainedUsers.length,

    retentionRate:
      Number(
        retentionRate.toFixed(2)
      ),
  };
}


/* ==========================================================================
   OVERVIEW
========================================================================== */

export async function getAnalyticsOverview(
  query = {}
) {
  const {
    startDate,
    endDate,
    days,
  } = getDateRange(query);


  const filter =
    activityFilter(
      startDate,
      endDate
    );


  const [
    totalEvents,

    activeUsers,

    sessions,

    moduleUsage,

    featureUsage,

    platformUsage,

    versionUsage,

    dailyActivity,

    totalRegisteredUsers,

    newUsers,

    dauUsers,

    wauUsers,

    mauUsers,

    retention,
  ] = await Promise.all([

    AnalyticsEvent.countDocuments(
      filter
    ),


    AnalyticsEvent.distinct(
      "userId",
      filter
    ),


    AnalyticsEvent.distinct(
      "sessionId",
      {
        ...filter,

        sessionId: {
          $exists: true,

          $nin: [
            "",
            null,
          ],
        },
      }
    ),


    /* ================================================================
       MODULE USAGE
    ================================================================= */

    AnalyticsEvent.aggregate([

      {
        $match: {
          ...filter,

          module: {
            $exists: true,

            $nin: [
              "",
              null,
              "unknown",
              "Unknown",
            ],
          },
        },
      },

      {
        $group: {
          _id:
            "$module",

          events: {
            $sum: 1,
          },

          users: {
            $addToSet:
              "$userId",
          },
        },
      },

      {
        $project: {
          _id: 0,

          module:
            "$_id",

          events: 1,

          users: {
            $size:
              "$users",
          },
        },
      },

      {
        $sort: {
          events: -1,
        },
      },

    ]),


    /* ================================================================
       FEATURE USAGE
    ================================================================= */

    AnalyticsEvent.aggregate([

      {
        $match: {
          ...filter,

          feature: {
            $exists: true,

            $nin: [
              "",
              null,
              "unknown",
              "Unknown",
            ],
          },
        },
      },

      {
        $group: {
          _id: {
            module:
              "$module",

            feature:
              "$feature",
          },

          events: {
            $sum: 1,
          },

          users: {
            $addToSet:
              "$userId",
          },
        },
      },

      {
        $project: {
          _id: 0,

          module:
            "$_id.module",

          feature:
            "$_id.feature",

          events: 1,

          users: {
            $size:
              "$users",
          },
        },
      },

      {
        $sort: {
          events: -1,
        },
      },

      {
        $limit: 100,
      },

    ]),


    /* ================================================================
       PLATFORM
    ================================================================= */

    AnalyticsEvent.aggregate([

      {
        $match: {
          ...filter,

          platform: {
            $exists: true,

            $nin: [
              "",
              null,
              "unknown",
              "Unknown",
            ],
          },
        },
      },

      {
        $group: {
          _id:
            "$platform",

          users: {
            $addToSet:
              "$userId",
          },

          events: {
            $sum: 1,
          },
        },
      },

      {
        $project: {
          _id: 0,

          platform:
            "$_id",

          users: {
            $size:
              "$users",
          },

          events: 1,
        },
      },

      {
        $sort: {
          users: -1,
        },
      },

    ]),


    /* ================================================================
       APP VERSION
    ================================================================= */

    AnalyticsEvent.aggregate([

      {
        $match: {
          ...filter,

          appVersion: {
            $exists: true,

            $nin: [
              "",
              null,
              "unknown",
              "Unknown",
            ],
          },
        },
      },

      {
        $group: {
          _id:
            "$appVersion",

          users: {
            $addToSet:
              "$userId",
          },

          events: {
            $sum: 1,
          },
        },
      },

      {
        $project: {
          _id: 0,

          version:
            "$_id",

          users: {
            $size:
              "$users",
          },

          events: 1,
        },
      },

      {
        $sort: {
          users: -1,
        },
      },

    ]),


    /* ================================================================
       DAILY ACTIVITY
    ================================================================= */

    AnalyticsEvent.aggregate([

      {
        $match:
          filter,
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format:
                "%Y-%m-%d",

              date:
                "$timestamp",
            },
          },

          events: {
            $sum: 1,
          },

          users: {
            $addToSet:
              "$userId",
          },

          sessions: {
            $addToSet:
              "$sessionId",
          },
        },
      },

      {
        $project: {
          _id: 0,

          date:
            "$_id",

          events: 1,

          users: {
            $size:
              "$users",
          },

          sessions: {
            $size: {
              $filter: {

                input:
                  "$sessions",

                as:
                  "session",

                cond: {
                  $and: [

                    {
                      $ne: [
                        "$$session",
                        null,
                      ],
                    },

                    {
                      $ne: [
                        "$$session",
                        "",
                      ],
                    },

                  ],
                },

              },
            },
          },
        },
      },

      {
        $sort: {
          date: 1,
        },
      },

    ]),


    /* ================================================================
       REGISTERED USERS
    ================================================================= */

    countRegisteredUsers(),


    /* ================================================================
       NEW USERS
    ================================================================= */

    countNewUsers(
      startDate,
      endDate
    ),


    /* ================================================================
       DAU
    ================================================================= */

    getDailyActiveUsers(
      endDate
    ),


    /* ================================================================
       WAU
    ================================================================= */

    getWeeklyActiveUsers(
      endDate
    ),


    /* ================================================================
       MAU
    ================================================================= */

    getMonthlyActiveUsers(
      endDate
    ),


    /* ================================================================
       RETENTION
    ================================================================= */

    calculateRetention(
      startDate,
      endDate
    ),

  ]);


  /* ========================================================================
     RETURNING USERS
  ======================================================================== */

  const returningUsers =
    await countReturningUsers(
      activeUsers,
      startDate
    );


  /* ========================================================================
     METRICS
  ======================================================================== */

  const dau =
    dauUsers.length;


  const wau =
    wauUsers.length;


  const mau =
    mauUsers.length;


  const growth =
    totalRegisteredUsers > 0
      ? (
          newUsers /
          totalRegisteredUsers
        ) *
        100
      : 0;


  return {

    period: {
      days,
      startDate,
      endDate,
    },


    totalEvents,


    totalUsers:
      activeUsers.length,


    activeUsers:
      activeUsers.length,


    totalRegisteredUsers,


    newUsers,


    returningUsers,


    dau,


    wau,


    mau,


    sessions:
      sessions.length,


    events:
      totalEvents,


    growth:
      Number(
        growth.toFixed(2)
      ),


    retentionRate:
      retention.retentionRate,


    retention,


    moduleUsage,


    modules:
      moduleUsage,


    featureUsage,


    features:
      featureUsage,


    platformUsage,


    platforms:
      platformUsage,


    versionUsage,


    versions:
      versionUsage,


    dailyActivity,

  };
}


/* ==========================================================================
   USER ENGAGEMENT
========================================================================== */

export async function getUserEngagementAnalytics(
  query = {}
) {
  const {
    startDate,
    endDate,
    days,
  } = getDateRange(query);


  const filter =
    activityFilter(
      startDate,
      endDate
    );


  const [
    users,
    sessions,
    totalEvents,
    dailyActivity,
  ] = await Promise.all([

    AnalyticsEvent.distinct(
      "userId",
      filter
    ),


    AnalyticsEvent.distinct(
      "sessionId",
      {
        ...filter,

        sessionId: {
          $exists: true,

          $nin: [
            "",
            null,
          ],
        },
      }
    ),


    AnalyticsEvent.countDocuments(
      filter
    ),


    AnalyticsEvent.aggregate([

      {
        $match:
          filter,
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format:
                "%Y-%m-%d",

              date:
                "$timestamp",
            },
          },

          users: {
            $addToSet:
              "$userId",
          },

          sessions: {
            $addToSet:
              "$sessionId",
          },

          events: {
            $sum: 1,
          },
        },
      },

      {
        $project: {
          _id: 0,

          date:
            "$_id",

          users: {
            $size:
              "$users",
          },

          sessions: {
            $size: {
              $filter: {

                input:
                  "$sessions",

                as:
                  "session",

                cond: {
                  $and: [

                    {
                      $ne: [
                        "$$session",
                        null,
                      ],
                    },

                    {
                      $ne: [
                        "$$session",
                        "",
                      ],
                    },

                  ],
                },

              },
            },
          },

          events: 1,
        },
      },

      {
        $sort: {
          date: 1,
        },
      },

    ]),

  ]);


  const sessionsPerUser =
    users.length > 0
      ? sessions.length /
        users.length
      : 0;


  const eventsPerSession =
    sessions.length > 0
      ? totalEvents /
        sessions.length
      : 0;


  const engagementRate =
    users.length > 0
      ? (
          sessions.length /
          users.length
        ) *
        100
      : 0;


  return {

    period: {
      days,
      startDate,
      endDate,
    },


    metrics: {

      totalUsers:
        users.length,


      activeUsers:
        users.length,


      sessions:
        sessions.length,


      events:
        totalEvents,


      sessionsPerUser:
        Number(
          sessionsPerUser.toFixed(2)
        ),


      averageSessionsPerUser:
        Number(
          sessionsPerUser.toFixed(2)
        ),


      eventsPerSession:
        Number(
          eventsPerSession.toFixed(2)
        ),


      averageSessionDuration:
        0,


      averageActiveDaysPerUser:
        0,


      averageFeaturesPerUser:
        0,


      averageModulesPerUser:
        0,


      engagementRate:
        Number(
          engagementRate.toFixed(2)
        ),

    },


    dailyActivity,

  };
}


/* ==========================================================================
   GENERAL USER SEGMENTS
========================================================================== */

export async function getUserSegmentsAnalytics(
  query = {}
) {
  const {
    startDate,
    endDate,
    days,
  } = getDateRange(query);


  const events =
    await AnalyticsEvent.aggregate([

      {
        $match:
          activityFilter(
            startDate,
            endDate
          ),
      },

      {
        $group: {
          _id:
            "$userId",

          events: {
            $sum: 1,
          },

          sessions: {
            $addToSet:
              "$sessionId",
          },

          modules: {
            $addToSet:
              "$module",
          },

          features: {
            $addToSet:
              "$feature",
          },

          activeDates: {
            $addToSet: {
              $dateToString: {
                format:
                  "%Y-%m-%d",

                date:
                  "$timestamp",
              },
            },
          },

          lastActivity: {
            $max:
              "$timestamp",
          },
        },
      },

      {
        $project: {
          _id: 0,

          userId:
            "$_id",

          events: 1,

          sessions: {
            $size: {
              $filter: {

                input:
                  "$sessions",

                as:
                  "session",

                cond: {
                  $and: [

                    {
                      $ne: [
                        "$$session",
                        null,
                      ],
                    },

                    {
                      $ne: [
                        "$$session",
                        "",
                      ],
                    },

                  ],
                },

              },
            },
          },

          modules: {
            $size: {
              $filter: {

                input:
                  "$modules",

                as:
                  "module",

                cond: {
                  $and: [

                    {
                      $ne: [
                        "$$module",
                        null,
                      ],
                    },

                    {
                      $ne: [
                        "$$module",
                        "",
                      ],
                    },

                  ],
                },

              },
            },
          },

          features: {
            $size: {
              $filter: {

                input:
                  "$features",

                as:
                  "feature",

                cond: {
                  $and: [

                    {
                      $ne: [
                        "$$feature",
                        null,
                      ],
                    },

                    {
                      $ne: [
                        "$$feature",
                        "",
                      ],
                    },

                  ],
                },

              },
            },
          },

          activeDays: {
            $size:
              "$activeDates",
          },

          lastActivity: 1,

        },
      },

      {
        $sort: {
          events: -1,
        },
      },

    ]);


  const users =
    events.map(
      (user) => {

        let segment =
          "Low Engagement";


        if (
          user.events >= 50
        ) {

          segment =
            "Power User";

        } else if (
          user.events >= 20
        ) {

          segment =
            "Highly Engaged";

        } else if (
          user.events >= 5
        ) {

          segment =
            "Regular User";

        }


        return {
          ...user,
          segment,
        };
      }
    );


  const totalUsers =
    users.length;


  const countSegment =
    (name) =>
      users.filter(
        (user) =>
          user.segment === name
      ).length;


  const powerUsers =
    countSegment(
      "Power User"
    );


  const highlyEngagedUsers =
    countSegment(
      "Highly Engaged"
    );


  const regularUsers =
    countSegment(
      "Regular User"
    );


  const lowEngagementUsers =
    countSegment(
      "Low Engagement"
    );


  const segmentDefinitions = [

    {
      segment:
        "Power User",

      users:
        powerUsers,
    },

    {
      segment:
        "Highly Engaged",

      users:
        highlyEngagedUsers,
    },

    {
      segment:
        "Regular User",

      users:
        regularUsers,
    },

    {
      segment:
        "Low Engagement",

      users:
        lowEngagementUsers,
    },

  ];


  const segments =
    segmentDefinitions.map(
      (segment) => ({

        ...segment,

        percentage:
          totalUsers > 0
            ? (
                segment.users /
                totalUsers
              ) *
              100
            : 0,

      })
    );


  return {

    period: {
      days,
      startDate,
      endDate,
    },


    summary: {

      totalUsers,

      powerUsers,

      highlyEngagedUsers,

      regularUsers,

      lowEngagementUsers,

    },


    totalUsers,

    powerUsers,

    highlyEngagedUsers,

    regularUsers,

    lowEngagementUsers,

    segments,

    users,

  };
}


/* ==========================================================================
   MODULE USAGE
========================================================================== */

export async function getModuleUsageAnalytics(
  query = {}
) {
  const {
    startDate,
    endDate,
    days,
  } = getDateRange(query);


  const modules =
    await AnalyticsEvent.aggregate([

      {
        $match: {

          ...activityFilter(
            startDate,
            endDate
          ),

          module: {
            $exists: true,

            $nin: [
              "",
              null,
              "unknown",
              "Unknown",
            ],
          },

        },
      },

      {
        $group: {

          _id:
            "$module",

          events: {
            $sum: 1,
          },

          users: {
            $addToSet:
              "$userId",
          },

          sessions: {
            $addToSet:
              "$sessionId",
          },

        },
      },

      {
        $project: {

          _id: 0,

          module:
            "$_id",

          events: 1,

          users: {
            $size:
              "$users",
          },

          sessions: {
            $size: {
              $filter: {

                input:
                  "$sessions",

                as:
                  "session",

                cond: {
                  $and: [

                    {
                      $ne: [
                        "$$session",
                        null,
                      ],
                    },

                    {
                      $ne: [
                        "$$session",
                        "",
                      ],
                    },

                  ],
                },

              },
            },
          },

        },
      },

      {
        $sort: {
          events: -1,
        },
      },

    ]);


  return {

    period: {
      days,
      startDate,
      endDate,
    },

    modules,

    moduleUsage:
      modules,

  };
}


/* ==========================================================================
   FEATURE USAGE
========================================================================== */

export async function getFeatureUsageAnalytics(
  query = {}
) {
  const {
    startDate,
    endDate,
    days,
  } = getDateRange(query);


  const features =
    await AnalyticsEvent.aggregate([

      {
        $match: {

          ...activityFilter(
            startDate,
            endDate
          ),

          feature: {
            $exists: true,

            $nin: [
              "",
              null,
              "unknown",
              "Unknown",
            ],
          },

        },
      },

      {
        $group: {

          _id: {

            module:
              "$module",

            feature:
              "$feature",

          },

          events: {
            $sum: 1,
          },

          users: {
            $addToSet:
              "$userId",
          },

        },
      },

      {
        $project: {

          _id: 0,

          module:
            "$_id.module",

          feature:
            "$_id.feature",

          events: 1,

          users: {
            $size:
              "$users",
          },

        },
      },

      {
        $sort: {
          events: -1,
        },
      },

      {
        $limit: 100,
      },

    ]);


  return {

    period: {
      days,
      startDate,
      endDate,
    },

    features,

    featureUsage:
      features,

  };
}


/* ==========================================================================
   FEATURE DETAIL
========================================================================== */

export async function getFeatureAnalytics(
  featureId,
  query = {}
) {
  const {
    startDate,
    endDate,
    days,
  } = getDateRange(query);


  const feature =
    String(featureId);


  const filter = {

    ...activityFilter(
      startDate,
      endDate
    ),

    feature,

  };


  const [
    events,
    users,
    sessions,
  ] = await Promise.all([

    AnalyticsEvent.countDocuments(
      filter
    ),

    AnalyticsEvent.distinct(
      "userId",
      filter
    ),

    AnalyticsEvent.distinct(
      "sessionId",
      filter
    ),

  ]);


  return {

    period: {
      days,
      startDate,
      endDate,
    },

    feature,

    events,

    users:
      users.length,

    sessions:
      sessions.length,

    totalEvents:
      events,

    totalUsers:
      users.length,

    totalSessions:
      sessions.length,

  };
}


/* ==========================================================================
   FEATURE ADOPTION
========================================================================== */

export async function getFeatureAdoption(
  featureId,
  query = {}
) {
  const {
    startDate,
    endDate,
  } = getDateRange(query);


  const filter =
    activityFilter(
      startDate,
      endDate
    );


  const [
    allUsers,
    featureUsers,
  ] = await Promise.all([

    AnalyticsEvent.distinct(
      "userId",
      filter
    ),

    AnalyticsEvent.distinct(
      "userId",
      {

        ...filter,

        feature:
          String(featureId),

      }
    ),

  ]);


  const adoption =
    allUsers.length > 0
      ? (
          featureUsers.length /
          allUsers.length
        ) *
        100
      : 0;


  return {

    feature:
      String(featureId),

    totalUsers:
      allUsers.length,

    featureUsers:
      featureUsers.length,

    adoption:
      Number(
        adoption.toFixed(2)
      ),

  };
}


/* ==========================================================================
   FEATURE FREQUENCY
========================================================================== */

export async function getFeatureFrequency(
  featureId,
  query = {}
) {
  const {
    startDate,
    endDate,
  } = getDateRange(query);


  const result =
    await AnalyticsEvent.aggregate([

      {
        $match: {

          ...activityFilter(
            startDate,
            endDate
          ),

          feature:
            String(featureId),

        },
      },

      {
        $group: {

          _id:
            "$userId",

          count: {
            $sum: 1,
          },

        },
      },

      {
        $group: {

          _id: null,

          users: {
            $sum: 1,
          },

          totalUsage: {
            $sum: "$count",
          },

          averageUsage: {
            $avg: "$count",
          },

        },
      },

    ]);


  return {

    feature:
      String(featureId),

    users:
      result[0]?.users || 0,

    totalUsage:
      result[0]?.totalUsage || 0,

    averageUsage:
      Number(
        (
          result[0]?.averageUsage ||
          0
        ).toFixed(2)
      ),

  };
}


/* ==========================================================================
   FEATURE USER SEGMENTS
========================================================================== */

export async function getFeatureUserSegments(
  featureId,
  query = {}
) {
  const {
    startDate,
    endDate,
  } = getDateRange(query);


  const segments =
    await AnalyticsEvent.aggregate([

      {
        $match: {

          ...activityFilter(
            startDate,
            endDate
          ),

          feature:
            String(featureId),

        },
      },

      {
        $group: {

          _id:
            "$userId",

          usageCount: {
            $sum: 1,
          },

        },
      },

      {
        $project: {

          segment: {

            $switch: {

              branches: [

                {

                  case: {
                    $gte: [
                      "$usageCount",
                      20,
                    ],
                  },

                  then:
                    "High",

                },

                {

                  case: {
                    $gte: [
                      "$usageCount",
                      5,
                    ],
                  },

                  then:
                    "Medium",

                },

              ],

              default:
                "Low",

            },

          },

        },
      },

      {
        $group: {

          _id:
            "$segment",

          users: {
            $sum: 1,
          },

        },
      },

      {
        $project: {

          _id: 0,

          segment:
            "$_id",

          users: 1,

        },
      },

      {
        $sort: {
          users: -1,
        },
      },

    ]);


  return {

    feature:
      String(featureId),

    segments,

  };
}


/* ==========================================================================
   FEATURE FUNNEL
========================================================================== */

export async function getFeatureFunnel(
  featureId,
  query = {}
) {
  const {
    startDate,
    endDate,
    days,
  } = getDateRange(query);


  const funnel =
    await AnalyticsEvent.aggregate([

      {
        $match: {

          ...activityFilter(
            startDate,
            endDate
          ),

          feature:
            String(featureId),

          eventName: {
            $exists: true,

            $nin: [
              "",
              null,
              "unknown",
              "Unknown",
            ],
          },

        },
      },

      {
        $group: {

          _id:
            "$eventName",

          users: {
            $addToSet:
              "$userId",
          },

          events: {
            $sum: 1,
          },

        },
      },

      {
        $project: {

          _id: 0,

          step:
            "$_id",

          users: {
            $size:
              "$users",
          },

          events: 1,

        },
      },

      {
        $sort: {
          users: -1,
        },
      },

    ]);


  return {

    period: {
      days,
      startDate,
      endDate,
    },

    feature:
      String(featureId),

    funnel,

  };
}


/* ==========================================================================
   RETENTION
========================================================================== */

export async function getRetentionAnalytics(
  query = {}
) {
  const {
    startDate,
    endDate,
    days,
  } = getDateRange(query);


  /*
   * Get registered users whose account was created
   * during the selected period.
   */

  const cohortUsers =
    await User.find(
      {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },

        status: {
          $ne: "DELETED",
        },
      },

      {
        _id: 1,
        createdAt: 1,
      }
    ).lean();


  const cohortSize =
    cohortUsers.length;


  if (
    cohortSize === 0
  ) {

    return {

      period: {
        days,
        startDate,
        endDate,
      },

      summary: {

        cohortSize: 0,

        retainedUsers: 0,

        retentionRate: 0,

      },

      cohorts: [],

      retention: [],

    };
  }


  const cohortIds =
    cohortUsers.map(
      (user) =>
        user._id
    );


  /*
   * Get all activity for cohort users.
   */

  const activity =
    await AnalyticsEvent.find(
      {
        userId: {
          $in: cohortIds,
        },

        timestamp: {
          $gte: startDate,
          $lt: endDate,
        },
      },

      {
        userId: 1,
        timestamp: 1,
      }
    ).lean();


  const activityMap =
    new Map();


  for (
    const event
    of activity
  ) {

    const userId =
      String(
        event.userId
      );


    if (
      !activityMap.has(
        userId
      )
    ) {

      activityMap.set(
        userId,
        new Set()
      );

    }


    const createdUser =
      cohortUsers.find(
        (user) =>
          String(
            user._id
          ) === userId
      );


    if (!createdUser) {
      continue;
    }


    const createdAt =
      new Date(
        createdUser.createdAt
      );


    const activityDate =
      new Date(
        event.timestamp
      );


    const day =
      Math.floor(
        (
          activityDate -
          createdAt
        ) /
          (
            1000 *
            60 *
            60 *
            24
          )
      );


    if (
      day >= 0
    ) {

      activityMap
        .get(userId)
        .add(day);

    }
  }


  const retainedUsers =
    new Set();


  for (
    const daysSet
    of activityMap.values()
  ) {

    if (
      daysSet.size > 1
    ) {
      retainedUsers.add(
        daysSet
      );
    }

  }


  const retentionDays = [
    1,
    7,
    14,
    30,
  ];


  const retention =
    retentionDays.map(
      (retentionDay) => {

        const eligibleUsers =
          cohortUsers.filter(
            (user) => {

              const age =
                Math.floor(
                  (
                    endDate -
                    new Date(
                      user.createdAt
                    )
                  ) /
                    (
                      1000 *
                      60 *
                      60 *
                      24
                    )
                );

              return (
                age >=
                retentionDay
              );

            }
          );


        const retained =
          eligibleUsers.filter(
            (user) => {

              const daysSet =
                activityMap.get(
                  String(
                    user._id
                  )
                );


              if (!daysSet) {
                return false;
              }


              return daysSet.has(
                retentionDay
              );

            }
          );


        return {

          day:
            retentionDay,

          eligibleUsers:
            eligibleUsers.length,

          retainedUsers:
            retained.length,

          rate:
            eligibleUsers.length > 0
              ? Number(
                  (
                    (
                      retained.length /
                      eligibleUsers.length
                    ) *
                    100
                  ).toFixed(2)
                )
              : null,

        };

      }
    );


  const overallRetainedUsers =
    cohortUsers.filter(
      (user) => {

        const daysSet =
          activityMap.get(
            String(
              user._id
            )
          );


        return (
          daysSet &&
          daysSet.size > 1
        );

      }
    ).length;


  const overallRetentionRate =
    cohortSize > 0
      ? (
          overallRetainedUsers /
          cohortSize
        ) *
        100
      : 0;


  /*
   * Cohort by registration date.
   */

  const cohortMap =
    new Map();


  for (
    const user
    of cohortUsers
  ) {

    const cohortDate =
      new Date(
        user.createdAt
      );


    const cohort =
      cohortDate
        .toISOString()
        .slice(
          0,
          10
        );


    if (
      !cohortMap.has(
        cohort
      )
    ) {

      cohortMap.set(
        cohort,
        {
          users: 0,
          retainedUsers: 0,
        }
      );

    }


    cohortMap.get(
      cohort
    ).users += 1;


    const daysSet =
      activityMap.get(
        String(
          user._id
        )
      );


    if (
      daysSet &&
      daysSet.size > 1
    ) {

      cohortMap.get(
        cohort
      ).retainedUsers += 1;

    }

  }


  const cohorts =
    Array.from(
      cohortMap.entries()
    )
      .map(
        (
          [
            cohort,
            value,
          ]
        ) => ({

          cohort,

          users:
            value.users,

          retainedUsers:
            value.retainedUsers,

          retentionRate:
            value.users > 0
              ? Number(
                  (
                    (
                      value.retainedUsers /
                      value.users
                    ) *
                    100
                  ).toFixed(2)
                )
              : 0,

        })
      )
      .sort(
        (a, b) =>
          a.cohort.localeCompare(
            b.cohort
          )
      );


  return {

    period: {
      days,
      startDate,
      endDate,
    },

    summary: {

      cohortSize,

      retainedUsers:
        overallRetainedUsers,

      retentionRate:
        Number(
          overallRetentionRate.toFixed(
            2
          )
        ),

    },

    cohorts,

    retention,

  };
}


/* ==========================================================================
   CROSS MODULE USAGE
========================================================================== */

export async function getCrossModuleAnalytics(
  query = {}
) {
  const {
    startDate,
    endDate,
    days,
  } = getDateRange(query);


  const events =
    await AnalyticsEvent.find(
      {
        ...activityFilter(
          startDate,
          endDate
        ),

        module: {
          $exists: true,

          $nin: [
            "",
            null,
            "unknown",
            "Unknown",
          ],
        },
      },

      {
        userId: 1,

        module: 1,

        sessionId: 1,

        timestamp: 1,
      }
    )
      .sort({
        timestamp: 1,
      })
      .lean();


  const userModules =
    new Map();

  const userEvents =
    new Map();

  const userSessions =
    new Map();

  const userLastActivity =
    new Map();

  const moduleUsers =
    new Map();

  const moduleEvents =
    new Map();


  for (
    const event
    of events
  ) {

    const userId =
      event.userId
        ? String(
            event.userId
          )
        : null;


    const module =
      String(
        event.module || ""
      ).trim();


    if (!module) {
      continue;
    }


    moduleEvents.set(
      module,
      (
        moduleEvents.get(
          module
        ) || 0
      ) + 1
    );


    if (
      !moduleUsers.has(
        module
      )
    ) {

      moduleUsers.set(
        module,
        new Set()
      );

    }


    if (userId) {

      moduleUsers
        .get(module)
        .add(userId);


      if (
        !userModules.has(
          userId
        )
      ) {

        userModules.set(
          userId,
          new Set()
        );

      }


      userModules
        .get(userId)
        .add(module);


      userEvents.set(
        userId,
        (
          userEvents.get(
            userId
          ) || 0
        ) + 1
      );


      if (
        event.sessionId
      ) {

        if (
          !userSessions.has(
            userId
          )
        ) {

          userSessions.set(
            userId,
            new Set()
          );

        }


        userSessions
          .get(userId)
          .add(
            String(
              event.sessionId
            )
          );

      }


      const previous =
        userLastActivity.get(
          userId
        );


      if (
        !previous ||
        new Date(
          event.timestamp
        ) >
          new Date(
            previous
          )
      ) {

        userLastActivity.set(
          userId,
          event.timestamp
        );

      }

    }

  }


  const totalUsers =
    userModules.size;


  const multiModuleUsers =
    Array.from(
      userModules.values()
    ).filter(
      (modules) =>
        modules.size > 1
    ).length;


  const totalModuleCount =
    Array.from(
      userModules.values()
    ).reduce(
      (
        total,
        modules
      ) =>
        total +
        modules.size,
      0
    );


  const averageModulesPerUser =
    totalUsers > 0
      ? totalModuleCount /
        totalUsers
      : 0;


  const moduleUsage =
    Array.from(
      moduleEvents.entries()
    )
      .map(
        (
          [
            module,
            eventCount,
          ]
        ) => {

          const users =
            moduleUsers.get(
              module
            )?.size || 0;


          return {

            module,

            events:
              eventCount,

            users,

            percentage:
              totalUsers > 0
                ? (
                    users /
                    totalUsers
                  ) *
                  100
                : 0,

          };

        }
      )
      .sort(
        (a, b) =>
          b.events -
          a.events
      );


  const combinationMap =
    new Map();


  for (
    const modules
    of userModules.values()
  ) {

    if (
      modules.size < 2
    ) {
      continue;
    }


    const combination =
      Array.from(
        modules
      )
        .sort()
        .join(
          " + "
        );


    combinationMap.set(
      combination,
      (
        combinationMap.get(
          combination
        ) || 0
      ) + 1
    );

  }


  const combinations =
    Array.from(
      combinationMap.entries()
    )
      .map(
        (
          [
            combination,
            users,
          ]
        ) => ({

          combination,

          users,

          percentage:
            totalUsers > 0
              ? (
                  users /
                  totalUsers
                ) *
                100
              : 0,

          usage:
            users,

        })
      )
      .sort(
        (a, b) =>
          b.users -
          a.users
      );


  const users =
    Array.from(
      userModules.entries()
    )
      .map(
        (
          [
            userId,
            modules,
          ]
        ) => ({

          userId,

          modules:
            Array.from(
              modules
            ).sort(),

          moduleCount:
            modules.size,

          events:
            userEvents.get(
              userId
            ) || 0,

          sessions:
            userSessions.get(
              userId
            )?.size || 0,

          lastActivity:
            userLastActivity.get(
              userId
            ) || null,

        })
      )
      .filter(
        (user) =>
          user.moduleCount > 1
      )
      .sort(
        (a, b) =>
          b.moduleCount -
            a.moduleCount ||
          b.events -
            a.events
      );


  const dailyMap =
    new Map();


  for (
    const event
    of events
  ) {

    if (!event.userId) {
      continue;
    }


    const date =
      new Date(
        event.timestamp
      )
        .toISOString()
        .slice(
          0,
          10
        );


    if (
      !dailyMap.has(
        date
      )
    ) {

      dailyMap.set(
        date,
        {
          users:
            new Set(),

          userModules:
            new Map(),
        }
      );

    }


    const daily =
      dailyMap.get(
        date
      );


    const userId =
      String(
        event.userId
      );


    const module =
      String(
        event.module || ""
      ).trim();


    if (!module) {
      continue;
    }


    daily.users.add(
      userId
    );


    if (
      !daily.userModules.has(
        userId
      )
    ) {

      daily.userModules.set(
        userId,
        new Set()
      );

    }


    daily.userModules
      .get(userId)
      .add(module);

  }


  const trends =
    Array.from(
      dailyMap.entries()
    )
      .map(
        (
          [
            date,
            daily,
          ]
        ) => {

          const activeUsers =
            daily.users.size;


          const dailyMultiModuleUsers =
            Array.from(
              daily.userModules.values()
            ).filter(
              (modules) =>
                modules.size > 1
            ).length;


          const totalModules =
            Array.from(
              daily.userModules.values()
            ).reduce(
              (
                total,
                modules
              ) =>
                total +
                modules.size,
              0
            );


          return {

            date,

            activeUsers,

            multiModuleUsers:
              dailyMultiModuleUsers,

            averageModules:
              activeUsers > 0
                ? totalModules /
                  activeUsers
                : 0,

          };

        }
      )
      .sort(
        (a, b) =>
          a.date.localeCompare(
            b.date
          )
      );


  return {

    period: {
      days,
      startDate,
      endDate,
    },


    summary: {

      totalUsers,

      multiModuleUsers,

      averageModulesPerUser:
        Number(
          averageModulesPerUser.toFixed(
            2
          )
        ),

      totalModuleCombinations:
        combinations.length,

    },


    moduleUsage,

    combinations,

    users,

    trends,


    crossModuleUsage:
      Array.from(
        userModules.entries()
      )
        .map(
          (
            [
              userId,
              modules,
            ]
          ) => ({

            userId,

            modules:
              Array.from(
                modules
              ).sort(),

            modulesUsed:
              modules.size,

            users: 1,

          })
        )
        .sort(
          (a, b) =>
            b.modulesUsed -
            a.modulesUsed
        ),

  };
}


/* ==========================================================================
   APP VERSION ANALYTICS
========================================================================== */

export async function getAppVersionAnalytics(
  query = {}
) {
  const {
    startDate,
    endDate,
    days,
  } = getDateRange(query);


  const versions =
    await AnalyticsEvent.aggregate([

      {
        $match: {

          ...activityFilter(
            startDate,
            endDate
          ),

          appVersion: {
            $exists: true,

            $nin: [
              "",
              null,
              "unknown",
              "Unknown",
            ],
          },

        },
      },

      {
        $group: {

          _id:
            "$appVersion",

          users: {
            $addToSet:
              "$userId",
          },

          events: {
            $sum: 1,
          },

        },
      },

      {
        $project: {

          _id: 0,

          version:
            "$_id",

          users: {
            $size:
              "$users",
          },

          events: 1,

        },
      },

      {
        $sort: {
          users: -1,
        },
      },

    ]);


  return {

    period: {
      days,
      startDate,
      endDate,
    },

    versions,

  };
}


/* ==========================================================================
   VERSION COMPATIBILITY EXPORT
========================================================================== */

export async function getVersionAnalytics(
  query = {}
) {
  return getAppVersionAnalytics(
    query
  );
}


/* ==========================================================================
   PLATFORM ANALYTICS
========================================================================== */

export async function getPlatformAnalytics(
  query = {}
) {
  const {
    startDate,
    endDate,
    days,
  } = getDateRange(query);


  const platforms =
    await AnalyticsEvent.aggregate([

      {
        $match: {

          ...activityFilter(
            startDate,
            endDate
          ),

          platform: {
            $exists: true,

            $nin: [
              "",
              null,
              "unknown",
              "Unknown",
            ],
          },

        },
      },

      {
        $group: {

          _id:
            "$platform",

          users: {
            $addToSet:
              "$userId",
          },

          events: {
            $sum: 1,
          },

        },
      },

      {
        $project: {

          _id: 0,

          platform:
            "$_id",

          users: {
            $size:
              "$users",
          },

          events: 1,

        },
      },

      {
        $sort: {
          users: -1,
        },
      },

    ]);


  return {

    period: {
      days,
      startDate,
      endDate,
    },

    platforms,

  };
}


/* ==========================================================================
   GEOGRAPHIC ANALYTICS
========================================================================== */

export async function getGeographicAnalytics(
  query = {}
) {
  const {
    startDate,
    endDate,
    days,
  } = getDateRange(query);


  const geography =
    await AnalyticsEvent.aggregate([

      {
        $match: {

          ...activityFilter(
            startDate,
            endDate
          ),

          "metadata.country": {
            $exists: true,

            $nin: [
              "",
              null,
              "unknown",
              "Unknown",
            ],
          },

        },
      },

      {
        $group: {

          _id:
            "$metadata.country",

          users: {
            $addToSet:
              "$userId",
          },

          events: {
            $sum: 1,
          },

        },
      },

      {
        $project: {

          _id: 0,

          country:
            "$_id",

          users: {
            $size:
              "$users",
          },

          events: 1,

        },
      },

      {
        $sort: {
          users: -1,
        },
      },

      {
        $limit: 50,
      },

    ]);


  return {

    period: {
      days,
      startDate,
      endDate,
    },

    geography,

  };
}


/* ==========================================================================
   FEATURE TRENDS
========================================================================== */

export async function getFeatureTrends(
  query = {}
) {
  const {
    startDate,
    endDate,
    days,
  } = getDateRange(query);


  const trends =
    await AnalyticsEvent.aggregate([

      {
        $match: {

          ...activityFilter(
            startDate,
            endDate
          ),

          feature: {
            $exists: true,

            $nin: [
              "",
              null,
              "unknown",
              "Unknown",
            ],
          },

        },
      },

      {
        $group: {

          _id: {

            feature:
              "$feature",

            date: {
              $dateToString: {

                format:
                  "%Y-%m-%d",

                date:
                  "$timestamp",

              },
            },

          },

          events: {
            $sum: 1,
          },

          users: {
            $addToSet:
              "$userId",
          },

        },
      },

      {
        $project: {

          _id: 0,

          feature:
            "$_id.feature",

          date:
            "$_id.date",

          events: 1,

          users: {
            $size: {
              $filter: {

                input:
                  "$users",

                as:
                  "user",

                cond: {
                  $ne: [
                    "$$user",
                    null,
                  ],
                },

              },
            },
          },

        },
      },

      {
        $sort: {
          date: 1,
        },
      },

    ]);


  return {

    period: {
      days,
      startDate,
      endDate,
    },

    trends,

  };
}


/* ==========================================================================
   ANALYTICS SUMMARY
========================================================================== */

export async function getAnalyticsSummary(
  query = {}
) {
  const [
    overview,
    engagement,
    modules,
    features,
  ] = await Promise.all([

    getAnalyticsOverview(
      query
    ),

    getUserEngagementAnalytics(
      query
    ),

    getModuleUsageAnalytics(
      query
    ),

    getFeatureUsageAnalytics(
      query
    ),

  ]);


  return {

    overview,

    engagement,

    modules,

    features,

  };
}