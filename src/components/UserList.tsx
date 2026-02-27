import type { UserDto } from "../lib/api";

interface Props {
  users: UserDto[];
  selectedUserId: string | null;
  onSelect: (user: UserDto) => void;
}

export default function UserList({ users, selectedUserId, onSelect }: Props) {
  return (
    <aside className="flex w-sidebar flex-col border-r bg-card">
      <div className="flex-1 overflow-y-auto">
        {users.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No users found</p>
        )}
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelect(user)}
            className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-accent ${
              selectedUserId === user.id
                ? "bg-accent font-medium text-accent-foreground"
                : "text-foreground"
            }`}
          >
            {user.username}
          </button>
        ))}
      </div>
    </aside>
  );
}
