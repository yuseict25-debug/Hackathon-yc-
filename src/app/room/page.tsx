import { RequireAuth } from "@/components/auth/RequireAuth";
import { RoomExperience } from "@/components/room/RoomExperience";

export default function RoomPage() {
  return (
    <RequireAuth>
      <RoomExperience />
    </RequireAuth>
  );
}
