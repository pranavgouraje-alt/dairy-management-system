import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
} from "../services/authService";

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    const token =
      localStorage.getItem(
        "dairyAuthToken"
      );

    const storedUser =
      localStorage.getItem(
        "dairyAuthUser"
      );

    if (!token) {
      setAuthLoading(false);
      return;
    }

    /*
      Show stored user immediately,
      then validate token with backend.
    */
    if (storedUser) {
      try {
        setUser(
          JSON.parse(storedUser)
        );
      } catch {
        localStorage.removeItem(
          "dairyAuthUser"
        );
      }
    }

    try {
      const result =
        await getCurrentUser();

      if (result.success) {
        setUser(result.data);

        localStorage.setItem(
          "dairyAuthUser",
          JSON.stringify(result.data)
        );
      }
    } catch (error) {
      console.error(
        "Session restoration error:",
        error
      );

      logout();
    } finally {
      setAuthLoading(false);
    }
  }

  async function login(
    username,
    password
  ) {
    const result = await loginUser({
      username,
      password,
    });

    if (!result.success) {
      throw new Error(
        result.message ||
          "Login failed"
      );
    }

    const { token, user: loggedUser } =
      result.data;

    localStorage.setItem(
      "dairyAuthToken",
      token
    );

    localStorage.setItem(
      "dairyAuthUser",
      JSON.stringify(loggedUser)
    );

    setUser(loggedUser);

    return result;
  }

  function logout() {
    localStorage.removeItem(
      "dairyAuthToken"
    );

    localStorage.removeItem(
      "dairyAuthUser"
    );

    setUser(null);
  }

  function hasRole(...roles) {
    return (
      user &&
      roles.includes(user.role)
    );
  }

  const value = {
    user,
    authLoading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}