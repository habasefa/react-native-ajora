import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAxiosInstance } from "./axios";

export interface ThreadItem {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  lastMessage?: { parts?: { text?: string }[] };
}

interface ThreadsResponse {
  data?: ThreadItem[];
}

interface CreateThreadResponse {
  data?: ThreadItem;
}

const normalizeThread = (t: any): ThreadItem => ({
  id: t.id ?? t._id,
  title: t.title ?? "New Conversation",
  createdAt: t.createdAt || t.created_at,
  updatedAt: t.updatedAt || t.updated_at,
  lastMessage: t.lastMessage,
});

export const getThreads = async (): Promise<ThreadItem[]> => {
  const axios = getAxiosInstance();
  const res = await axios.get<ThreadItem[] | ThreadsResponse>("/threads", {
    params: { _: Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });

  const data = res.data;

  if (Array.isArray(data)) {
    return data.map(normalizeThread);
  }

  if (data && "data" in data && Array.isArray(data.data)) {
    return data.data.map(normalizeThread);
  }

  console.warn("[Ajora]: Unexpected threads response shape");
  return [];
};

export const createThread = async (title?: string): Promise<ThreadItem> => {
  const axios = getAxiosInstance();
  const res = await axios.post<ThreadItem | CreateThreadResponse>("/threads", {
    title,
  });

  const data = res.data;
  const thread = data && "data" in data ? data.data : data;

  if (!thread) {
    throw new Error("Empty thread response");
  }

  return normalizeThread(thread);
};

// React Query hooks
export const useThreads = () => {
  return useQuery({
    queryKey: ["threads"],
    queryFn: getThreads,
    staleTime: 0, // Always refetch
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateThread = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title?: string) => createThread(title),
    onSuccess: (newThread) => {
      // Optimistically update the threads list
      queryClient.setQueryData<ThreadItem[]>(["threads"], (old) => {
        if (!old) return [newThread];
        return [newThread, ...old];
      });
      // Invalidate to refetch and get the latest data
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
};
