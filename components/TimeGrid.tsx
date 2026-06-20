"use client";

import { useRef, useEffect, useState } from "react";
import { generateSlots, timeToMinutes, minutesToTime } from "@/lib/ranking";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  dates: string[];
  startTime: string;
  endTime: string;
  stepMinutes: number;
  selectedSlots: string[];
  onChange: (slots: string[]) => void;
};

const PAGE_SIZE = 4;

export default function TimeGrid({ dates, startTime, endTime, stepMinutes, selectedSlots, onChange }: Props) {
  const pending = useRef<Set<string>>(new Set(selectedSlots));
  const isDragging = useRef(false);
  const addMode = useRef(true);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(dates.length / PAGE_SIZE);
  const visibleDates = dates.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    pending.current = new Set(selectedSlots);
  }, [selectedSlots]);

  // 날짜가 바뀌면 첫 페이지로
  useEffect(() => {
    setPage(0);
  }, [dates]);

  const timeLabels: string[] = [];
  let cur = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  while (cur < end) {
    timeLabels.push(minutesToTime(cur));
    cur += stepMinutes;
  }

  function toggleSlot(slotKey: string) {
    const changed = addMode.current
      ? !pending.current.has(slotKey)
      : pending.current.has(slotKey);
    if (!changed) return;

    if (addMode.current) pending.current.add(slotKey);
    else pending.current.delete(slotKey);
    onChange(Array.from(pending.current));
  }

  function handlePointerDown(e: React.PointerEvent, slotKey: string) {
    e.preventDefault();
    isDragging.current = true;
    pending.current = new Set(selectedSlots);
    addMode.current = !pending.current.has(slotKey);
    toggleSlot(slotKey);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return;
    e.preventDefault();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const slotKey = el?.getAttribute("data-slot");
    if (slotKey) toggleSlot(slotKey);
  }

  function handlePointerUp() {
    isDragging.current = false;
  }

  useEffect(() => {
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

  const selectedSet = new Set(selectedSlots);

  return (
    <div className="space-y-2">
      {/* 페이지 네비게이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <span className="text-xs text-gray-400">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, dates.length)} / {dates.length}일
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </div>
      )}

      {/* 그리드 */}
      <div
        className="flex w-full select-none"
        style={{ touchAction: "none" }}
        onPointerMove={handlePointerMove}
      >
        {/* 시간 라벨 */}
        <div className="flex flex-col pt-8 shrink-0">
          {timeLabels.map((t, i) => (
            <div
              key={t}
              className="h-7 flex items-center justify-end pr-2 text-xs text-gray-400 w-10"
            >
              {i % 2 === 0 ? t : ""}
            </div>
          ))}
        </div>

        {/* 날짜 컬럼 */}
        {visibleDates.map((date) => {
          const slots = generateSlots(date, startTime, endTime, stepMinutes);
          const [year, month, day] = date.split("-").map(Number);
          const DOW = ["일","월","화","수","목","금","토"][new Date(year, month - 1, day).getDay()];

          return (
            <div key={date} className="flex flex-col flex-1 min-w-0">
              <div className="h-8 flex items-center justify-center border-b border-gray-200">
                <span className="text-xs font-semibold text-gray-700">{month}/{day}({DOW})</span>
              </div>
              {slots.map((slotKey) => (
                <div
                  key={slotKey}
                  data-slot={slotKey}
                  className={`h-7 border-b border-r border-gray-200 cursor-pointer transition-colors duration-75 ${
                    selectedSet.has(slotKey)
                      ? "bg-black"
                      : "bg-white hover:bg-gray-100"
                  }`}
                  onPointerDown={(e) => handlePointerDown(e, slotKey)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
