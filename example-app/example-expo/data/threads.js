import dayjs from "dayjs";

const now = dayjs();
const yesterday = now.clone().subtract(1, "day");
const lastWeek = now.clone().subtract(1, "week");
const lastMonth = now.clone().subtract(1, "month");

export default [
  {
    id: "thread_1",
    title: "React Native Project Help",
    lastMessage:
      "Perfect! I can see you're using a modern message structure with support for tool calls and different content types.",
    timestamp: now.toDate(),
    isActive: true,
  },
  {
    id: "thread_2",
    title: "UI Design Discussion",
    lastMessage:
      "The new shadcn-inspired design looks great! The black and white theme is very clean.",
    timestamp: yesterday.toDate(),
    isActive: false,
  },
  {
    id: "thread_3",
    title: "Animation Implementation",
    lastMessage:
      "For advanced animations and gestures, I recommend React Native Reanimated 3 and Gesture Handler.",
    timestamp: lastWeek.toDate(),
    isActive: false,
  },
  {
    id: "thread_4",
    title: "Component Architecture",
    lastMessage:
      "The decomposition of Header and Thread components looks well organized.",
    timestamp: lastMonth.toDate(),
    isActive: false,
  },
  {
    id: "thread_5",
    title: "Performance Optimization",
    lastMessage:
      "Great! I found some excellent resources for React Native performance improvements.",
    timestamp: lastMonth.toDate(),
    isActive: false,
  },
];
