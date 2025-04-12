import { QueryClient } from "@tanstack/react-query";

async function throwIfResNotOk(res) {
  if (!res.ok) {
    try {
      // Try to parse as JSON first
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.json();
        throw new Error(errorData.message || `${res.status}: ${res.statusText}`);
      } else {
        // Fallback to text if not JSON
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
    } catch (error) {
      // If JSON parsing fails, throw the original error or a fallback
      if (error.name === "SyntaxError") {
        throw new Error(`${res.status}: Invalid response format`);
      }
      throw error;
    }
  }
}

export async function apiRequest(
  method,
  url,
  data,
) {
  console.log(`Making ${method} request to ${url}`);
  
  // Check if data is FormData
  const isFormData = data instanceof FormData;
  
  const res = await fetch(url, {
    method,
    headers: data && !isFormData ? { "Content-Type": "application/json" } : {},
    body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Added debugging for response
  const contentType = res.headers.get('content-type');
  console.log(`Response from ${url}: status=${res.status}, content-type=${contentType}`);
  
  return res;
}

export const getQueryFn =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0], {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
