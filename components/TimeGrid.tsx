"use client";

import { useRef, useEffect } from "react";
import { generateSlots, timeToMinutes, minutesToTime } from "@/lib/ranking";

type Props = {
  dates: string[];
  startTime: string;
  endTime: string;
  stepMinutes: number;
  selectedSlots: string[];
  onChange: (slots: string[]) => void;
};

export default function TimeGrid({ dates, startTime, endTime, stepMinutes, selectedSlots, onChange }: Props) {
  const pending = useRef<Set<string>>(new Set(selectedSlots));
  const isDragging = useRef(false);
  const addMode = useRef(true); // true = 추가, false = 제거

  // prop이 바뀔 때(기존 응답 로드 등) ref 동기화
  useEffect(() => {
    pending.current = new Set(selectedSlots);
  }, [selectedSlots]);

  // 시간 라벨 생성
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
    pending.current = new Set(selectedSlots); // 현재 상태에서 시작
    addMode.current = !pending.current.has(slotKey);
    toggleSlot(slotKey);
  }

  // 컨테이너 전체에서 pointermove를 잡고 elementFromPoint로 셀 찾기
  // → setPointerCapture 없이 마우스/터치 드래그 모두 동작
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
    <div
      className="overflow-x-auto select-none"
      style={{ touchAction: "none" }}
      onPointerMove={handlePointerMove}
    >
      <div className="inline-flex">
        {/* 시간 라벨 */}
        <div className="flex flex-col pt-8">
          {timeLabels.map((t, i) => (
            <div
              key={t}
              className="h-7 flex items-center justify-end pr-2 text-xs text-gray-400 w-12 shrink-0"
            >
              {i % 2 === 0 ? t : ""}
            </div>
          ))}
        </div>

        {/* 날짜 컬럼 */}
        {dates.map((date) => {
          const slots = generateSlots(date, startTime, endTime, stepMinutes);
          const [, month, day] = date.split("-").map(Number);

          return (
            <div key={date} className="flex flex-col">
              <div className="h-8 flex items-center justify-center text-xs font-semibold text-gray-700 px-1 border-b border-gray-200 w-16 shrink-0">
                {month}/{day}
              </div>
              {slots.map((slotKey) => (
                <div
                  key={slotKey}
                  data-slot={slotKey}
                  className={`h-7 w-16 shrink-0 border-b border-r border-gray-200 cursor-pointer transition-colors duration-75 ${
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
