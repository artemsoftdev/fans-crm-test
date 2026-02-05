import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function apiRequest<T>(
  endpoint: string,
  token: string | null,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}/${endpoint}`;

  const headersObj: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token && token.trim()) {
    headersObj["Authorization"] = `Bearer ${token.trim()}`;
  }

  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        if (typeof value === "string") {
          headersObj[key] = value;
        }
      });
    } else {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === "string") {
          headersObj[key] = value;
        }
      });
    }
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers: headersObj,
    body: options.body,
    credentials: "include",
    mode: "cors",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    );
    (error as any).status = response.status;
    (error as any).response = { data: errorData };
    throw error;
  }

  return response.json();
}

async function getAuthToken(): Promise<string> {
  const cachedToken = localStorage.getItem("auth_token");
  if (cachedToken) {
    return cachedToken;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        username: "test",
        password: "test",
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();

    if (data?.access_token) {
      localStorage.setItem("auth_token", data.access_token);
      return data.access_token;
    } else {
      throw new Error("No access_token in response");
    }
  } catch (error: any) {
    localStorage.removeItem("auth_token");
    throw new Error("Failed to authenticate");
  }
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  birthdate: string;
}

interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function UsersPage() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    birthdate: "",
  });

  const isFetchingRef = useRef(false);
  const tokenInitializedRef = useRef(false);
  const lastFetchParamsRef = useRef<string>("");

  useEffect(() => {
    const initAuth = async () => {
      if (tokenInitializedRef.current) {
        return;
      }

      try {
        const cachedToken = localStorage.getItem("auth_token");
        if (cachedToken) {
          setAuthToken(cachedToken);
          tokenInitializedRef.current = true;
          return;
        }

        const token = await getAuthToken();
        setAuthToken(token);
        tokenInitializedRef.current = true;
      } catch (error) {
        setError("Не вдалося авторизуватися");
        localStorage.removeItem("auth_token");
        tokenInitializedRef.current = true;
      }
    };
    initAuth();
  }, []);

  const fetchUsers = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }

    if (!tokenInitializedRef.current) {
      return;
    }

    const token = authToken || localStorage.getItem("auth_token");

    if (!token) {
      return;
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: "10",
      ...(filters.name && { name: filters.name }),
      ...(filters.email && { email: filters.email }),
      ...(filters.phone && { phone: filters.phone }),
    });
    const paramsString = params.toString();

    if (lastFetchParamsRef.current === paramsString) {
      return;
    }

    lastFetchParamsRef.current = paramsString;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<UsersResponse>(
        `get-users?${paramsString}`,
        token,
        {
          method: "GET",
        },
      );

      setUsers(response.data);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Помилка завантаження користувачів";
      setError(errorMessage);

      if (err.status === 401) {
        localStorage.removeItem("auth_token");
        setAuthToken(null);
        lastFetchParamsRef.current = "";
        try {
          const newToken = await getAuthToken();
          setAuthToken(newToken);
        } catch (authError) {
          setAuthToken(null);
        }
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [authToken, page, filters.name, filters.email, filters.phone]);

  useEffect(() => {
    if (
      tokenInitializedRef.current &&
      (authToken || localStorage.getItem("auth_token"))
    ) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, page, filters.name, filters.email, filters.phone]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    let token = authToken;
    if (!token) {
      const cachedToken = localStorage.getItem("auth_token");
      if (cachedToken) {
        token = cachedToken;
        setAuthToken(cachedToken);
      } else {
        try {
          token = await getAuthToken();
          setAuthToken(token);
        } catch (error) {
          setError("Не вдалося авторизуватися");
          return;
        }
      }
    }

    if (!token) {
      setError("Немає токена авторизації");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const userData: any = {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
      };

      if (newUser.birthdate && newUser.birthdate.trim()) {
        userData.birthdate = newUser.birthdate;
      }

      await apiRequest(`add-user`, token, {
        method: "POST",
        body: JSON.stringify(userData),
      });
      setNewUser({ name: "", email: "", phone: "", birthdate: "" });
      fetchUsers();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Помилка додавання користувача";
      setError(errorMessage);

      if (err.status === 401) {
        localStorage.removeItem("auth_token");
        setAuthToken(null);
        try {
          const newToken = await getAuthToken();
          setAuthToken(newToken);
        } catch (authError) {
          setAuthToken(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-8">
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl font-bold text-gray-900 mb-6"
      >
        Управління користувачами
      </motion.h1>

      {/* Add User Form */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white p-6 rounded-lg shadow-md mb-6"
      >
        <h2 className="text-xl font-semibold mb-4">Додати користувача</h2>
        <form
          onSubmit={handleAddUser}
          className="grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <input
            type="text"
            placeholder="Ім'я"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="tel"
            placeholder="Телефон"
            value={newUser.phone}
            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="date"
            placeholder="Дата народження"
            value={newUser.birthdate}
            onChange={(e) =>
              setNewUser({ ...newUser, birthdate: e.target.value })
            }
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            Додати
          </motion.button>
        </form>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 rounded-lg shadow-md mb-6"
      >
        <h2 className="text-xl font-semibold mb-4">Фільтри</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Фільтр за ім'ям"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Фільтр за email"
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Фільтр за телефоном"
            value={filters.phone}
            onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users List */}
      {loading && !users.length ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ім'я
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Телефон
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата народження
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {users.map((user, index) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.birthdate).toLocaleDateString("uk-UA")}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 flex justify-center items-center space-x-2"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Попередня
          </motion.button>
          <span className="px-4 py-2 text-gray-700">
            Сторінка {page} з {totalPages}
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Наступна
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

export default UsersPage;
