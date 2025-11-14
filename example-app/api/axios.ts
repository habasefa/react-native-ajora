import axios from "axios";

export interface AxiosConfig {
  baseUrl: string;
  bearerToken?: string;
}

let axiosInstance: ReturnType<typeof axios.create> | null = null;

export const createAxiosInstance = (config: AxiosConfig) => {
  const base = config.baseUrl.replace(/\/$/, "");
  const apiBase = /\/api(\/|$)/.test(base) ? base : `${base}/api`;

  axiosInstance = axios.create({
    baseURL: apiBase,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(config.bearerToken && {
        Authorization: `Bearer ${config.bearerToken}`,
      }),
    },
    timeout: 30000,
  });

  // Request interceptor - log outgoing requests
  axiosInstance.interceptors.request.use(
    (config) => {
      const method = config.method?.toUpperCase() || "GET";
      const url = config.url;
      console.log(`[Ajora:Client] ${method} ${url}`);
      return config;
    },
    (error) => {
      console.error(`[Ajora:Client] Request Error:`, error.message);
      return Promise.reject(error);
    }
  );

  // Response interceptor - log incoming responses
  axiosInstance.interceptors.response.use(
    (response) => {
      const method = response.config.method?.toUpperCase() || "GET";
      const url = response.config.url;
      const status = response.status;
      console.log(`[Ajora:Client] ${method} ${url} [${status}]`);
      return response;
    },
    (error) => {
      const method = error.config?.method?.toUpperCase() || "GET";
      const url = error.config?.url;
      const status = error.response?.status || "ERROR";
      console.error(
        `[Ajora:Client] ${method} ${url} [${status}] ${error.message}`
      );
      if (error.code) {
        console.error(`[Ajora:Client] Error code: ${error.code}`);
      }
      if (!error.response && error.request) {
        console.error(`[Ajora:Client] No response received.`);
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export const getAxiosInstance = () => {
  if (!axiosInstance) {
    throw new Error(
      "Axios instance not initialized. Call createAxiosInstance first."
    );
  }
  return axiosInstance;
};

export const updateAxiosConfig = (config: Partial<AxiosConfig>) => {
  if (!axiosInstance) {
    return;
  }

  const base = config.baseUrl?.replace(/\/$/, "") || "";
  const apiBase = /\/api(\/|$)/.test(base) ? base : `${base}/api`;

  axiosInstance.defaults.baseURL = apiBase;

  if (config.bearerToken) {
    axiosInstance.defaults.headers.common["Authorization"] =
      `Bearer ${config.bearerToken}`;
  } else if (config.bearerToken === null) {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
};
