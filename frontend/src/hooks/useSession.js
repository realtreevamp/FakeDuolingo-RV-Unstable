import { useCallback, useEffect, useState } from "react";
import * as userApi from "../api/userApi";

const guestUser = {
  xp: 9999,
  username: "Guest_Hacker",
  rank: "Аноним",
  avatar: "👤",
  solvedTasks: [],
  streak: 0,
};

export function useSession() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [user, setUser] = useState(null);

  const activeUser = isGuestMode && !isAuthenticated ? guestUser : user;

  const checkAuthStatus = useCallback(() => {
    return userApi
      .getCurrentUser()
      .then((data) => {
        setIsAuthenticated(true);
        setIsGuestMode(false);
        setUser(data);
        return data;
      })
      .catch(() => {
        setIsAuthenticated(false);
        if (!isGuestMode) {
          setUser(null);
        }
        return null;
      });
  }, [isGuestMode]);

  const refreshUserData = useCallback(() => {
    if (!isAuthenticated || isGuestMode) {
      return Promise.resolve(null);
    }

    return userApi
      .getCurrentUser()
      .then((data) => {
        setUser((prevUser) => {
          if (prevUser && prevUser.rank && data.rank !== prevUser.rank) {
            // Компонент App.js может обрабатывать показ ачивок на основе сравнения рангов
          }
          return data;
        });
        return data;
      })
      .catch((err) => {
        console.error("Ошибка при обновлении данных пользователя:", err);
        return null;
      });
  }, [isAuthenticated, isGuestMode]);

  const handleAuthSuccess = useCallback((userData) => {
    setIsAuthenticated(true);
    setIsGuestMode(false);
    setUser(userData);
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    activeUser,
    isAuthenticated,
    isGuestMode,
    user,
    setIsGuestMode,
    setUser,
    checkAuthStatus,
    refreshUserData,
    handleAuthSuccess,
  };
}
