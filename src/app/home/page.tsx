"use client";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Not logged in</div>;
  }
  return (
    <>
      <div className="w-full h-full flex justify-center text-center items-center">
        <div>
          <p>Welcome {session.user.name}</p>
          <p>{session.user.email}</p>
        </div>
      </div>
      <div className="flex justify-center">

      </div>
    </>
  );
}
