"use client";

import { useState, useRef } from "react";
import { useNotification } from "./notification/useNotification";
import { authClient } from "@/lib/auth-client";

type LogoutButtonProps = {
  children?: string;
  className?: string;
  modal?: boolean;
  toggleOnHover?: {
    hoverDelay?: number;
  };
};

type LogoutModalProps = {
  onResponse: (response: boolean) => void;
};

function LogoutModal({ onResponse }: LogoutModalProps) {
  return (
    <div className="
      fixed
      inset-0
      z-50
      flex
      items-center
      justify-center
      bg-black/50
    ">
      <div className="
        w-[90%]
        max-w-md
        rounded-lg
        bg-white
        p-6
        shadow-xl
      ">
        <h2 className="text-xl font-semibold">
          Logout
        </h2>

        <p className="mt-2 text-gray-600">
          Are you sure you want to logout?
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => onResponse(false)}
            className="rounded-md px-4 py-2"
          >
            Cancel
          </button>

          <button
            onClick={() => onResponse(true)}
            className="rounded-md bg-red-500 px-4 py-2 text-white"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}


function useLogout(
  modal: boolean,
  toggleOnHover?: {
    hoverDelay?: number;
  }
) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const [isNotificationOpen, setNotificationIsOpen] = useState(false);
  const { notify } = useNotification();


  async function logout() {
    const { error } = await authClient.signOut({
      callbackURL: '/',
    })
    if (error) {
      notify({
        title: "Logout error",
        type: "error"
      })
      console.error("Logout login error:", error);
      return;
    }
    setNotificationIsOpen(true)
    notify({
      title: "Déconnexion",
      message: "Vous avez été déconnecté.",
      type: "success"
    });
  }

  function handleLogout() {
    if (modal) {
      setIsLogoutModalOpen(true);
      return;
    }

    logout();
  }

  function handleMouseEnter() {
    if (!toggleOnHover) {
      return
    }

    hoverTimer.current = setTimeout(() => {
      handleLogout();
    }, toggleOnHover.hoverDelay);
  }

  function handleMouseLeave() {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }

  function handleModalResponse(response: boolean) {
    setIsLogoutModalOpen(false);

    if (response) {
      logout();
    }
  }

  return {
    isNotificationOpen,
    isLogoutModalOpen,
    handleLogout,
    handleMouseEnter,
    handleMouseLeave,
    handleModalResponse,
  };
}

export default function LogoutButton({
  children,
  className,
  modal = false,
  toggleOnHover = {
    hoverDelay: 300,
  },
}: LogoutButtonProps) {
  const {
    isLogoutModalOpen,
    handleLogout,
    handleMouseEnter,
    handleMouseLeave,
    handleModalResponse,
  } = useLogout(modal, toggleOnHover);

  return (
    <>
      <div
        className={`
          bg-gray-500
          hover:bg-gray-400
          duration-300
          flex
          justify-center
          text-center
          cursor-pointer
          rounded-lg
          h-8 px-3
          sm:h-9 sm:px-4
          md:h-10 md:px-4
          lg:h-11 lg:px-5
          xl:h-12 xl:px-6
          ${className ?? ""}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleLogout}
      >
        <button
          className="cursor-pointer" 
        >
          {children ?? "Logout"}
        </button>
      </div>

      {isLogoutModalOpen && (
        <LogoutModal onResponse={handleModalResponse} />
      )}
    </>
  );
}