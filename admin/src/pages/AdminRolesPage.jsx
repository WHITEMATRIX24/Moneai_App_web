import PageHeader from "../components/PageHeader.jsx";
import "./AdminRolesPage.css";

const roles = [
  {
    name: "SUPER_ADMIN",
    description:
      "Full platform access. Can manage administrators, users, configuration and permissions.",
    permissions: {
      dashboard: true,
      users: true,
      changeUserStatus: true,
      adminUsers: true,
      manageAdmins: true,
      aiUsage: true,
      appConfig: true,
      featureFlags: true,
    },
  },
  {
    name: "ADMIN",
    description:
      "Administrative access for managing users and platform operations.",
    permissions: {
      dashboard: true,
      users: true,
      changeUserStatus: true,
      adminUsers: true,
      manageAdmins: false,
      aiUsage: true,
      appConfig: true,
      featureFlags: true,
    },
  },
  {
    name: "SUPPORT",
    description:
      "Support-focused access for viewing and managing user accounts.",
    permissions: {
      dashboard: true,
      users: true,
      changeUserStatus: true,
      adminUsers: false,
      manageAdmins: false,
      aiUsage: true,
      appConfig: false,
      featureFlags: false,
    },
  },
  {
    name: "ANALYST",
    description:
      "Read-focused access for dashboards, users and analytics.",
    permissions: {
      dashboard: true,
      users: true,
      changeUserStatus: false,
      adminUsers: false,
      manageAdmins: false,
      aiUsage: true,
      appConfig: false,
      featureFlags: false,
    },
  },
];

const permissionLabels = [
  {
    key: "dashboard",
    label: "Dashboard",
    description:
      "View the admin dashboard and platform statistics.",
  },
  {
    key: "users",
    label: "Users",
    description:
      "View platform user accounts and user details.",
  },
  {
    key: "changeUserStatus",
    label: "Change User Status",
    description:
      "Change user account status between active and suspended.",
  },
  {
    key: "adminUsers",
    label: "Admin Users",
    description:
      "View administrator accounts.",
  },
  {
    key: "manageAdmins",
    label: "Manage Admins",
    description:
      "Create, edit, activate, disable or delete administrator accounts.",
  },
  {
    key: "aiUsage",
    label: "AI Usage",
    description:
      "View AI usage and request information.",
  },
  {
    key: "appConfig",
    label: "App Configuration",
    description:
      "View and modify platform configuration.",
  },
  {
    key: "featureFlags",
    label: "Feature Flags",
    description:
      "Manage platform feature flags.",
  },
];

function formatRole(role) {
  return role
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminRolesPage() {
  return (
    <div className="admin-roles-page">
      <PageHeader
        title="Roles & Permissions"
        subtitle="View administrator roles and the access available to each role."
      />

      {/* ============================== */}
      {/* ROLE CARDS */}
      {/* ============================== */}

      <div className="roles-grid">
        {roles.map((role) => (
          <div className="role-card" key={role.name}>
            <div className="role-card-header">
              <div className="role-icon">
                {role.name === "SUPER_ADMIN"
                  ? "SA"
                  : role.name === "ADMIN"
                  ? "AD"
                  : role.name === "SUPPORT"
                  ? "SP"
                  : "AN"}
              </div>

              <div>
                <h3>{formatRole(role.name)}</h3>

                <span className="role-code">
                  {role.name}
                </span>
              </div>
            </div>

            <p className="role-description">
              {role.description}
            </p>

            <div className="role-permission-summary">
              <strong>
                {
                  Object.values(role.permissions).filter(
                    Boolean
                  ).length
                }
              </strong>

              <span>
                of {permissionLabels.length} permissions
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================== */}
      {/* PERMISSION MATRIX */}
      {/* ============================== */}

      <div className="card permissions-card">
        <div className="permissions-header">
          <div>
            <h3>Permission Matrix</h3>

            <p>
              Compare access levels across administrator
              roles.
            </p>
          </div>
        </div>

        <div className="permissions-table-wrapper">
          <table className="permissions-table">
            <thead>
              <tr>
                <th>Permission</th>

                {roles.map((role) => (
                  <th key={role.name}>
                    {formatRole(role.name)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {permissionLabels.map((permission) => (
                <tr key={permission.key}>
                  <td>
                    <div className="permission-name">
                      <strong>
                        {permission.label}
                      </strong>

                      <span>
                        {permission.description}
                      </span>
                    </div>
                  </td>

                  {roles.map((role) => (
                    <td
                      key={`${role.name}-${permission.key}`}
                    >
                      {role.permissions[
                        permission.key
                      ] ? (
                        <span className="permission-allowed">
                          ✓
                        </span>
                      ) : (
                        <span className="permission-denied">
                          —
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================== */}
      {/* IMPORTANT NOTES */}
      {/* ============================== */}

      <div className="card permissions-note">
        <div className="permissions-note-icon">
          !
        </div>

        <div>
          <h4>Permission control</h4>

          <p>
            Permissions are enforced by the backend.
            This page is a reference for understanding
            what each administrator role can access.
          </p>
        </div>
      </div>
    </div>
  );
}