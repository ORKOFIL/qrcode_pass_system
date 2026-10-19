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

export const getMemoryAccessToken = () => {
    return memoryAccessToken
};

// 2. REQUEST INTERCEPTOR: додаємо токен до кожного вихідного запиту
api.interceptors.request.use((config) => {
    if (memoryAccessToken) {
        config.headers.Authorization = `Bearer ${memoryAccessToken}`;
    }
    return config;
});

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

        // --- КРИТИЧНО ВАЖЛИВИЙ ЗАХИСТ ВІД ЗАЦИКЛЕННЯ ---
        // Якщо сам запит на рефреш повернув 401 (токен у куці протух/недійсний),
        // ми не йдемо на повторне коло, а одразу падаємо в catch нижче.
        if (originalRequest.url?.includes("/api/auth/refresh")) {
            return Promise.reject(error);
        }

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
                const { data } = await api.post("/auth/refresh");

                const newToken = data.accessToken;

                // Зберігаємо новий токен у пам'ять
                setMemoryAccessToken(newToken);

                processQueue(null, newToken);

                originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                return api(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);

                // Очищаємо пам'ять і кидаємо на логін
                setMemoryAccessToken(null);

                const currentPath = window.location.pathname;
                const isTicketPage = /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentPath);
                if (isTicketPage) {
                }else{
                    window.location.href = "/auth";
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);