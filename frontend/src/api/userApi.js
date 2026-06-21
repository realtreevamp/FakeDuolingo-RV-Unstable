const BASE_URL = "/api";

const handleResponse = async (response) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Сервер вернул ошибку");
  }
  return payload;
};

const request = (path, options = {}) =>
  fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  }).then(handleResponse);

export const getCurrentUser = () => request("/user");
export const login = (credentials) =>
  request("/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
export const register = (credentials) =>
  request("/register", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
export const logout = () =>
  request("/logout", {
    method: "POST",
  });
export const updateProfile = (payload) =>
  request("/user/update", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const completeLesson = (payload) =>
  request("/user/complete-lesson", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const getLesson = (roomId) => request(`/lessons/${encodeURIComponent(roomId)}`);
