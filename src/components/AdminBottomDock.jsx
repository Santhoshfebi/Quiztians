import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from "@mui/icons-material/BarChart";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import LogoutIcon from "@mui/icons-material/Logout";

import { roleThemes } from "../theme/roleTheme";

export default function AdminBottomDock({ role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const theme = roleThemes[role || "admin"];

  const navItems = [
    { label: "Dashboard", icon: <DashboardIcon />, route: "/admin" },
    { label: "Add", icon: <AddCircleIcon />, route: "/admin/add-questions" },
    {
      label: "Preview",
      icon: <QuestionAnswerIcon />,
      route: "/admin/preview-questions",
    },
    {
      label: "Quiz",
      icon: <PlayArrowIcon />,
      route: "/admin/preview-quiz",
    },
    {
      label: "Config",
      icon: <SettingsIcon />,
      route: "/admin/quiz-config",
    },
    {
      label: "Results",
      icon: <BarChartIcon />,
      route: "/admin/view-results",
    },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md sm:max-w-xl">
      <div
        className={`
        flex items-center justify-between
        px-2 sm:px-4 py-2
        rounded-2xl
        backdrop-blur-xl
        border border-white/10
        shadow-2xl
        ${theme.sidebarBg}
      `}
      >
        {navItems.map((item, i) => {
          const active = location.pathname === item.route;

          return (
            <button
              key={i}
              onClick={() => navigate(item.route)}
              className={`
                flex flex-col items-center justify-center
                flex-1 py-1.5 rounded-xl
                transition-all group
                ${
                  active
                    ? `bg-gradient-to-r ${theme.accentGradient} text-white`
                    : `${theme.textPrimary} hover:bg-white/10`
                }
              `}
            >
              <div className="text-lg sm:text-xl transition-transform group-hover:scale-110">
                {item.icon}
              </div>

              <span className="text-[9px] sm:text-[11px] mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/admin-login");
          }}
          className="flex flex-col items-center flex-1 text-red-400 py-1.5"
        >
          <LogoutIcon className="text-lg sm:text-xl" />
          <span className="text-[9px] sm:text-[11px] mt-0.5">Logout</span>
        </button>
      </div>
    </div>
  );
}