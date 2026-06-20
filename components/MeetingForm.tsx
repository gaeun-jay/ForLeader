"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { generateTimeOptions } from "@/lib/ranking";
import { X } from "lucide-react";

type Props = {
  onCreated: () => void;
};

export default function MeetingForm({ onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("22:00");
  const [participantsRaw, setParticipantsRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const timeOptions = generateTimeOptions(0, 24 * 60, 30);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const date = e.target.value;
    if (!date || dates.includes(date)) return;
    setDates((prev) => [...prev, date].sort());
    e.target.value = ""; // input 초기화
  }

  function removeDate(d: string) {
    setDates((prev) => prev.filter((x) => x !== d));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const participants = participantsRaw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!title || dates.length === 0 || participants.length === 0) {
      alert("제목, 날짜, 참가자를 모두 입력해주세요.");
      return;
    }

    if (startTime >= endTime) {
      alert("종료 시각은 시작 시각보다 늦어야 합니다.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("meetings").insert({
      title,
      dates,
      start_time: startTime,
      end_time: endTime,
      step_minutes: 30,
      participants,
    });
    setSubmitting(false);

    if (error) {
      alert("오류: " + error.message);
      return;
    }

    setTitle("");
    setDates([]);
    setParticipantsRaw("");
    setStartTime("09:00");
    setEndTime("22:00");
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="font-bold text-base">새 회의 만들기</h2>

      {/* 제목 */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          회의 제목
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 6월 정기 회의"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>

      {/* 후보 날짜 */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          후보 날짜
        </label>
        <input
          type="date"
          onChange={handleDateChange}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        />
        {dates.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {dates.map((d) => {
              const [, m, day] = d.split("-").map(Number);
              return (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-xs font-medium"
                >
                  {m}/{day}
                  <button type="button" onClick={() => removeDate(d)}>
                    <X size={12} className="text-gray-400 hover:text-black" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* 시간 범위 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            시작 시각
          </label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            {timeOptions.slice(0, -1).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            종료 시각
          </label>
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            {timeOptions.slice(1).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 참가자 */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          참가자 이름{" "}
          <span className="font-normal text-gray-400 lowercase">(콤마 또는 줄바꿈으로 구분)</span>
        </label>
        <textarea
          value={participantsRaw}
          onChange={(e) => setParticipantsRaw(e.target.value)}
          placeholder={"철수\n영희\n민수"}
          rows={4}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full py-3 rounded-xl text-sm font-semibold"
      >
        {submitting ? "생성 중…" : "회의 생성"}
      </button>
    </form>
  );
}
