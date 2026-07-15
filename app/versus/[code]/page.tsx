import { VersusRoom } from "./room-client";

export default async function VersusRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <VersusRoom code={code.toUpperCase()} />;
}
