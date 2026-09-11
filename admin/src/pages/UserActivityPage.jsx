import { useParams, useNavigate } from "react-router-dom";
import "./UserActivityPage.css";

import {
  FaArrowLeft,
  FaSignInAlt,
  FaKey,
  FaMobileAlt,
  FaUserEdit,
} from "react-icons/fa";

import PageHeader from "../components/PageHeader.jsx";

export default function UserActivityPage() {
  const { userId, id } = useParams();
  const currentUserId = userId || id;
  const navigate = useNavigate();

  const activities = [
    {
      id: 1,
      type: "login",
      title: "User logged in",
      description:
        "Successful login from Chrome on Windows",
      time: "Today, 10:30 AM",
    },

    {
      id: 2,
      type: "device",
      title: "New device added",
      description:
        "Android device registered",
      time: "Yesterday, 7:15 PM",
    },

    {
      id: 3,
      type: "password",
      title: "Password updated",
      description:
        "Account password was changed",
      time: "3 days ago",
    },

    {
      id: 4,
      type: "profile",
      title: "Profile updated",
      description:
        "User account information updated",
      time: "1 week ago",
    },
  ];

  function ActivityIcon({ type }) {

    if (type === "login") {
      return <FaSignInAlt />;
    }

    if (type === "device") {
      return <FaMobileAlt />;
    }

    if (type === "password") {
      return <FaKey />;
    }

    return <FaUserEdit />;
  }

  return (
    <>

      <PageHeader
        title="User Activity"
        subtitle="Privacy-safe account activity summary"
      />

      <button
        className="back-btn"
        onClick={() =>
          navigate(`/admin/users/${currentUserId}`)
        }
      >
        <FaArrowLeft />
        Back to User
      </button>

      <div className="card activity-card">

        <div className="activity-timeline">

          {activities.map((activity) => (

            <div
              className="activity-item"
              key={activity.id}
            >

              <div className="activity-icon">
                <ActivityIcon
                  type={activity.type}
                />
              </div>

              <div className="activity-content">

                <h3>
                  {activity.title}
                </h3>

                <p>
                  {activity.description}
                </p>

                <span>
                  {activity.time}
                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </>
  );
}