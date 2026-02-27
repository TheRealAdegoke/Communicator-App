import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getToken,
  clearToken,
  getUsers,
  getMessages,
  sendMessage,
  addToOfflineQueue,
  openMessageStream,
} from "../lib/api";
import type { UserDto, MessageDto } from "../lib/api";
import UserList from "../components/UserList";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { toast } from "../hooks/use-toast";

const NAME_ID_CLAIM =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
const USERNAME_CLAIM =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

function parseJwt(token: string): Record<string, string> {
  const base64 = token.split(".")[1];
  const padded = base64.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(padded));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  const [users, setUsers] = useState<UserDto[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const selectedUserRef = useRef<UserDto | null>(null);
  selectedUserRef.current = selectedUser;

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const payload = parseJwt(token);
      setCurrentUserId(
        payload[NAME_ID_CLAIM] || payload.sub || payload.nameid || ""
      );
      setCurrentUsername(
        payload[USERNAME_CLAIM] || payload.unique_name || payload.name || "User"
      );
    } catch {
      clearToken();
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!currentUserId) return;
    getUsers()
      .then(setUsers)
      .catch(() => toast.error("Could not load users"));
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    const closeStream = openMessageStream((incomingMsg) => {
      const partner = selectedUserRef.current;
      const isCurrentConversation =
        partner &&
        ((incomingMsg.senderId === partner.id &&
          incomingMsg.receiverId === currentUserId) ||
          (incomingMsg.senderId === currentUserId &&
            incomingMsg.receiverId === partner.id));

      if (isCurrentConversation) {
        setMessages((prev) => {
          // Avoid duplicates — the sender already added an optimistic message
          const alreadyExists = prev.some((m) => m.id === incomingMsg.id);
          return alreadyExists ? prev : [...prev, incomingMsg];
        });
      }
    });

    return closeStream;
  }, [currentUserId]);

  const fetchMessages = useCallback(() => {
    if (!selectedUser) return;
    getMessages(selectedUser.id)
      .then(setMessages)
      .catch(() => {});
  }, [selectedUser]);

  useEffect(() => {
    setMessages([]);
    fetchMessages();
  }, [fetchMessages]);

  async function handleSend(content: string) {
    if (!selectedUser) return;

    const optimisticMsg: MessageDto = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      receiverId: selectedUser.id,
      content,
      timestamp: new Date().toISOString(),
    };

    if (!navigator.onLine) {
      addToOfflineQueue({ receiverId: selectedUser.id, content });
      setMessages((prev) => [...prev, optimisticMsg]);
      toast.info("Message queued (offline)");
      return;
    }

    // Show message instantly before the server responds
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const savedMsg = await sendMessage(selectedUser.id, content);
      // Replace optimistic placeholder with the real server message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? savedMsg : m))
      );
    } catch (err: any) {
      toast.error("Failed to send message", { description: err.message });
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      addToOfflineQueue({ receiverId: selectedUser.id, content });
    }
  }

  function handleLogout() {
    clearToken();
    toast.success("Signed out");
    navigate("/login");
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b bg-card px-4 shadow-sm">
        <h1 className="text-lg font-semibold">Communicator</h1>
        <div className="flex items-center gap-4">
          {!isOnline ? (
            <span className="rounded bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
              Offline
            </span>
          ) : (
            <span className="rounded bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
              Logged in as {currentUsername}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 border-r bg-card flex flex-col">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Users</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <UserList
              users={users}
              selectedUserId={selectedUser?.id ?? null}
              onSelect={setSelectedUser}
            />
          </div>
        </aside>

        {/* Chat */}
        {selectedUser ? (
          <div className="flex flex-1 flex-col bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
            <div className="flex h-14 items-center gap-3 border-b bg-card px-4 shadow-sm">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                {selectedUser.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-medium">{selectedUser.username}</h2>
              </div>
            </div>

            <ChatWindow
              messages={messages}
              currentUserId={currentUserId}
              partnerUsername={selectedUser.username}
            />

            <MessageInput onSend={handleSend} disabled={false} />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-muted/30">
            <div className="text-center">
              <h3 className="text-lg font-medium text-muted-foreground">
                Select a conversation
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Start chatting with someone from the list
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
