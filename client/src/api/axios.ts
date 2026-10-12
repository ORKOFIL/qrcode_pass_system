import axios from "axios";

// 1. Створюємо інстанс і вмикаємо передачу кук
export const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true, // <--- КРИТИЧНО: щоб браузер надсилав HttpOnly куку
});

// Змінна в пам'яті для Access Token (замість localStorage)
let memoryAccessToken: string | null = null;

export const setMemoryAccessToken = (token: string | null) => {
    memoryAccessToken = token;
};

// 2. REQUEST INTERCEPTOR: додаємо токен до кожного вихідного запиту
api.interceptors.request.use((config) => {
    if (memoryAccessToken) {
        config.headers.Authorization = `Bearer ${memoryAccessToken}`;
    }
    return config;
});

// --- Далі йде той самий код черги з документації Axios ---

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
};

// 3. RESPONSE INTERCEPTOR: ловимо 401 і робимо рефреш
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers["Authorization"] = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // ВИПРАВЛЕННЯ ТУТ: тіло пусте, бо рефреш-токен летить у HttpOnly куці самостійно!
                const { data } = await api.post("/api/auth/refresh");

                const newToken = data.accessToken;

                // Зберігаємо новий токен у пам'ять (замість localStorage!)
                setMemoryAccessToken(newToken);

                processQueue(null, newToken);

                originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                return api(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);

                // Очищаємо пам'ять і кидаємо на логін
                setMemoryAccessToken(null);
                window.location.href = "/login";

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);