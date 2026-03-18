import { Navigate, useNavigate, useParams } from "react-router-dom";

import Chat from "../member/Chat";
import { useAppState } from "../contexts/AppStateContext";
import { CLONES_MARKET } from "../lib/mockData";

// /chat/:cloneId — 채팅. cloneId로 클론 조회(마켓 또는 구독), 없으면 마켓으로.

export default function ChatPage() {
  const { cloneId } = useParams();
  const navigate = useNavigate();
  const { subscribed, freeUsed, setFreeUsed, surveyDone, setSurveyDone } = useAppState();

  const clone = CLONES_MARKET.find((c) => c.id === cloneId);
  if (!clone) return <Navigate to="/market" replace />;

  return (
    <div style={{ position: "relative" }}>
      <Chat
        clone={clone}
        subscribed={subscribed}
        freeUsed={freeUsed}
        setFreeUsed={setFreeUsed}
        surveyDone={surveyDone}
        setSurveyDone={setSurveyDone}
      />
    </div>
  );
}
