import { getLanguage } from "../i18n";

const STATUS_MAP_VI = {
  DRAFT: "Nháp",
  SUBMITTED: "Đã gửi",
  APPROVED: "Đã duyệt",
  FUNDED: "Đã huy động",
  PARTIALLY_PAID: "Đã trả một phần",
  PAID: "Đã thanh toán",
  CONFIRMED: "Đã xác nhận",
  PENDING: "Đang chờ",
  REVIEW: "Xem xét",
  ON_TRACK: "Đúng tiến độ",
};

export const formatCurrencyShort = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  const absValue = Math.abs(value);
  if (absValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (absValue >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }

  return value.toFixed(0);
};

export const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return `${value.toFixed(1)}%`;
};

export const formatDate = (value) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  const lang = getLanguage();
  const locale = lang === "vi" ? "vi-VN" : "en-US";
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "2-digit",
  });
};

export const formatRelativeTime = (value) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - date.getTime());
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const isVi = getLanguage() === "vi";

  if (diffMinutes < 60) {
    const minutes = diffMinutes || 1;
    return isVi ? `${minutes} phút trước` : `${minutes} minutes ago`;
  }
  if (diffHours < 24) {
    return isVi ? `${diffHours} giờ trước` : `${diffHours} hours ago`;
  }
  return isVi ? `${diffDays} ngày trước` : `${diffDays} days ago`;
};

export const toTitle = (value) => {
  if (!value) {
    return "-";
  }
  const lang = getLanguage();
  const normalized = value.toString().toUpperCase();
  if (lang === "vi" && STATUS_MAP_VI[normalized]) {
    return STATUS_MAP_VI[normalized];
  }
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const addMonths = (dateValue, months) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

export const sumBy = (items, getter) =>
  items.reduce((total, item) => total + (getter(item) || 0), 0);

export const uniqueCount = (items, getter) => {
  const set = new Set();
  items.forEach((item) => {
    const value = getter(item);
    if (value) {
      set.add(value);
    }
  });
  return set.size;
};
