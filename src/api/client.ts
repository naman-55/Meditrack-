let inMemoryAccessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const subscribeTokenRefresh = (cb: (token: string | null) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((cb) => {
    try {
      cb(token);
    } catch (e) {
      console.warn('Refresh subscriber error:', e);
    }
  });
  refreshSubscribers = [];
};

export const getAccessToken = (): string | null => {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  return localStorage.getItem('token');
};

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

const getHeaders = (isFormData = false): Record<string, string> => {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

const tryRefreshToken = async (): Promise<string | null> => {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({})
    });

    if (!res.ok) {
      setAccessToken(null);
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      setAccessToken(data.access_token);
      return data.access_token;
    }
    return null;
  } catch (e) {
    setAccessToken(null);
    return null;
  }
};

const executeWithRefresh = async (
  url: string,
  options: RequestInit,
  isFormData = false
): Promise<Response> => {
  const mergedOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      ...getHeaders(isFormData),
      ...(options.headers as Record<string, string> || {})
    }
  };

  let res = await fetch(url, mergedOptions);

  // If 401 encountered, attempt silent refresh unless this is already the auth endpoint
  if (res.status === 401 && !url.includes('/api/auth/login') && !url.includes('/api/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      let newToken: string | null = null;
      try {
        newToken = await tryRefreshToken();
      } finally {
        isRefreshing = false;
        onTokenRefreshed(newToken);
      }

      if (newToken) {
        // Retry original request with new token
        const retryOptions: RequestInit = {
          ...options,
          credentials: 'include',
          headers: {
            ...getHeaders(isFormData),
            ...(options.headers as Record<string, string> || {}),
            Authorization: `Bearer ${newToken}`
          }
        };
        return fetch(url, retryOptions);
      }
      return res;
    } else {
      // Wait for ongoing refresh
      const retryToken = await new Promise<string | null>((resolve) => {
        subscribeTokenRefresh((token) => resolve(token));
      });

      if (retryToken) {
        const retryOptions: RequestInit = {
          ...options,
          credentials: 'include',
          headers: {
            ...getHeaders(isFormData),
            ...(options.headers as Record<string, string> || {}),
            Authorization: `Bearer ${retryToken}`
          }
        };
        return fetch(url, retryOptions);
      }
      return res;
    }
  }

  return res;
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    if (res.status === 401) {
      setAccessToken(null);
    }
    const text = await res.text();
    let errorMsg = text;
    try {
      const parsed = JSON.parse(text);
      errorMsg = parsed.error || parsed.detail || parsed.message || text;
    } catch (e) {}
    const err: any = new Error(errorMsg);
    err.status = res.status;
    throw err;
  }
  return res.json();
};

export const apiClient = {
  get: async (url: string) => {
    const res = await executeWithRefresh(url, { method: 'GET' });
    return handleResponse(res);
  },
  post: async (url: string, data: any) => {
    const res = await executeWithRefresh(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  put: async (url: string, data: any) => {
    const res = await executeWithRefresh(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  postForm: async (url: string, formData: FormData) => {
    const res = await executeWithRefresh(
      url,
      {
        method: 'POST',
        body: formData
      },
      true
    );
    return handleResponse(res);
  },
  delete: async (url: string) => {
    const res = await executeWithRefresh(url, { method: 'DELETE' });
    return handleResponse(res);
  }
};
