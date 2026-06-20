"use client";

import { useState, useEffect } from "react";
import { supabase, Meeting, Response } from "@/lib/supabase";
import { calculateRanking } from "@/lib/ranking";
import TimeGrid from "./TimeGrid";
import RankingList from "./RankingList";
import { CheckCircle, ChevronDown } from "lucide-react";

type Props = {
  meetings: Meeting[];
};

export default function RespondClient({ meetings }: Props) {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("");
  const [responses, setResponses] = useState<Response[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const meeting = meetings.find((m) => m.id === selectedMeetingId);

  // Fetch responses when meeting changes
  useEffect(() => {
    if (!selectedMeetingId) {
      setResponses([]);
      setSelectedName("");
      setSelectedSlots([]);
      setNote("");
      setSubmitted(false);
      setForceShowForm(false);
      return;
    }

    supabase
      .from("responses")
      .select("*")
      .eq("meeting_id", selectedMeetingId)
      .then(({ data }) => {
        setResponses((data as Response[]) ?? []);
      });

    setSelectedName("");
    setSelectedSlots([]);
    setNote("");
    setSubmitted(false);
  }, [selectedMeetingId]);

  // Pre-fill grid when participant selects their name
  useEffect(() => {
    if (!selectedName) {
      setSelectedSlots([]);
      setNote("");
      return;
    }
    const existing = responses.find((r) => r.name === selectedName);
    if (existing) {
      setSelectedSlots(existing.available_slots);
      setNote(existing.note ?? "");
    } else {
      setSelectedSlots([]);
      setNote("");
    }
    setSubmitted(false);
  }, [selectedName, responses]);

  const [forceShowForm, setForceShowForm] = useState(false);

  const respondedNames = new Set(responses.map((r) => r.name));
  const allResponded = meeting ? respondedNames.size >= meeting.participants.length : false;
  const showForm = !allResponded || forceShowForm;
  const ranking = meeting ? calculateRanking(responses, meeting) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!meeting || !selectedName) return;

    setSubmitting(true);
    const { error } = await supabase.from("responses").upsert(
      {
        meeting_id: meeting.id,
        name: selectedName,
        available_slots: selectedSlots,
        note: note || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "meeting_id,name" }
    );
    setSubmitting(false);

    if (error) {
      alert("저장 중 오류가 발생했습니다: " + error.message);
      return;
    }

    // Refresh responses
    const { data } = await supabase
      .from("responses")
      .select("*")
      .eq("meeting_id", meeting.id);
    setResponses((data as Response[]) ?? []);
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">회의 시간 조율</h1>
          <a
            href="/admin"
            className="text-xs text-gray-400 hover:text-black transition-colors"
          >
            관리자
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 회의 선택 */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            회의 선택
          </label>
          <div className="relative">
            <select
              value={selectedMeetingId}
              onChange={(e) => setSelectedMeetingId(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">회의를 선택하세요</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {meeting && (
          <>
            {/* 응답 폼 — 전원 완료 후 수정 시에도 표시 */}
            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 이름 선택 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    이름 선택
                  </label>
                  <div className="relative">
                    <select
                      value={selectedName}
                      onChange={(e) => setSelectedName(e.target.value)}
                      className="w-full appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="">이름을 선택하세요</option>
                      {meeting.participants.map((name) => (
                        <option key={name} value={name}>
                          {name}
                          {respondedNames.has(name) ? " ✓" : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                  {selectedName && respondedNames.has(selectedName) && (
                    <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                      <CheckCircle size={12} className="text-green-500" />
                      이미 응답했습니다. 수정 후 다시 제출하면 기존 응답이 교체됩니다.
                    </p>
                  )}
                </div>

                {/* 그리드 */}
                {selectedName && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      가능 시간 선택{" "}
                      <span className="font-normal text-gray-400 lowercase">(클릭/드래그)</span>
                    </label>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden p-3">
                      <TimeGrid
                        dates={meeting.dates}
                        startTime={meeting.start_time}
                        endTime={meeting.end_time}
                        stepMinutes={meeting.step_minutes}
                        selectedSlots={selectedSlots}
                        onChange={setSelectedSlots}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-400">
                      {selectedSlots.length}개 슬롯 선택됨
                    </p>
                  </div>
                )}

                {/* 특이사항 */}
                {selectedName && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      특이사항{" "}
                      <span className="font-normal text-gray-400 lowercase">(선택)</span>
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="예: 17시 이후 온라인만 가능"
                      rows={2}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                )}

                {/* 제출 버튼 */}
                {selectedName && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-3 rounded-xl text-sm font-semibold"
                  >
                    {submitting ? "저장 중…" : submitted ? "✓ 응답 완료" : "응답 제출"}
                  </button>
                )}
              </form>
            )}

            {/* 전원 완료 배너 */}
            {allResponded && !forceShowForm && (
              <div className="bg-black text-white rounded-xl px-4 py-3 text-sm font-semibold text-center flex items-center justify-between">
                <span>전원 응답 완료</span>
                <button
                  type="button"
                  onClick={() => setForceShowForm(true)}
                  className="text-xs font-normal text-gray-300 hover:text-white underline underline-offset-2 transition-colors"
                >
                  수정하기
                </button>
              </div>
            )}

            {/* 랭킹 */}
            {responses.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  응답 현황 ({responses.length}/{meeting.participants.length}명 응답)
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 px-4 py-2">
                  <RankingList
                    slots={ranking}
                    totalParticipants={meeting.participants.length}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
