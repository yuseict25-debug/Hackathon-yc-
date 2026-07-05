import { RequireAuth } from "@/components/auth/RequireAuth";
import { RoomExperience } from "@/components/room/RoomExperience";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RoomSessionPage({ params }: Props) {
  const { id } = await params;

  return (
    <RequireAuth>
      <RoomExperience sessionId={id} />
    </RequireAuth>
  );
}
